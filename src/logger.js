'use strict';

import assert       from 'assert';
import _            from 'lodash';
import net          from 'net';
import { inspect }  from 'util';
import Promise      from 'bluebird';
import NodeCache    from 'node-cache';
import uuid         from 'uuid-js';
import jsonEnable   from './json-socket';

let promiseCache = new NodeCache( {
  stdTTL: 5,
  checkperiod: 1,
  useClones: false
} );

promiseCache.on( 'expired', ( ref, deferred ) => {
  deferred.reject( 'No server response.' );
} );

/**
 * @access public
 */
export default class Logger {

  /**
   * Create a new instance of Logger
   * @constructor
   * @access public
   * @param { object }  opts
   * @param { boolean } opts.console
   * @param { string }  opts.store
   * @param { string }  opts.scope
   * @param { string }  opts.token
   * @param { number }  opts.timeout
   * @param { int }     opts.port
   * @param { string }  opts.host
   */
  constructor( opts ) {
    if ( !opts.console ) {
      assert( opts.store, `'store' is not specified` );
      assert( opts.token, `'token' is not specified` );
    }

    this._opts = _.merge( {
      timeout: 5,
      scope: 'global',
      levels: Logger.DEFAULT_LOG_LEVELS,
      level: 'info'
    }, opts || {} );

    _.each( this._opts.levels, level => {
      this[ level ] =  input  => {
        return this.log( level, input );
      };
    } );

    this._authPhase = true;
    this._propSocket = this._socket;
  }

  /*
  * Getter / Setter for the logger level
  */

  get level() {
    return this._opts.level;
  }

  set level( severity ) {
    this._opts.level = severity;
  }

  /**
   * Log
   * @access public
   * @param  {string} level
   * @param  {...*}
   */
  log( params ) {
    let level = params;
    let offset = 1;

    if ( arguments.length == 1 ) {
      offset = 0;
      level = this._opts.level;
    } else if ( arguments.length > 1 ) {
      assert( _.includes( this._opts.levels, level ), `'${level}' is not a log level` );
    }

    let data = {
      '@level': level,
      '@scope': this._opts.scope,
      '@timestamp': new Date().toISOString()
    };

    let object = {};

    _.times( arguments.length - offset, ( index ) => {
      let arg = arguments[ index + offset ];
      if ( _.isPlainObject( arg ) ) {
        _.merge( object, arg );
      } else {
        if ( !object[ '@message' ] ) {
          object[ '@message' ] = [];
        } else {
          object[ '@message' ] = [ object[ '@message' ] ];
        }
        object[ '@message' ].push( ( typeof arg === 'string' ) ? arg : inspect( arg ) );
        object[ '@message' ] = object[ '@message' ].join( ' ' );
      }
    } );

    _.merge( data, object );

    return this._log( data );
  }

  /**
   * Indicate that the next log operation should return a Promise
   * @access public
   */
  ack() {
    this._ack = true;
    return this;
  }

  /**
   * Sends the log data into the transport
   * @access private
   * @return {?Promise}
   */
  _log( data ) {

    let deferred;

    if ( this._opts.console ) {
      console.log( data );
    } else {
      let request = {
        ref: this._ack ? uuid.create( 1 ).toString() : undefined,
        operation: 'SEND_LOG',
        store: this._opts.store,
        payload: data
      };

      if ( this._ack ) {
        deferred = new Promise.pending();
        promiseCache.set( request.ref, deferred, this._opts.timeout );
      }

      this._propSocket.write( request );
    }

    this._ack = false;

    if ( deferred ) {
      return deferred.promise;
    }
  }

  /**
   * Gets the socket connection
   * @access protected
   */
  get _socket() {
    if ( !this._opts.console && !this._propSocket ) {
      let socket = net.connect( {
        port: this._opts.port || 5555,
        host: this._opts.host || 'localhost'
      } );

      jsonEnable( socket, 'json' );

      socket.on( 'json', response => {
        this._handleRequest( response );
      } );

      /**
       * Send authentication request to server
       */
      socket.write( {
        ref: uuid.create( 1 ).toString(),
        operation: 'CONNECT',
        store: this._opts.store,
        token: this._opts.token
      } );

      this._propSocket = socket;
    }
    return this._propSocket;
  }

  /**
   * Server response handler
   * @param { object } response
   */
  _handleRequest( response ) {
    if ( this._authPhase ) {
      if ( response.success ) {
        this._authPhase = false;
      } else {
        let error = response.error;
        throw new Error( `Error ${error.code}. ${error.message}` );
      }
    } else {
      this._resolvePromise( response );
    }
  }

  /**
   * Resolve pending promise
   * @access protected
   * @param { object } data
   */
  _resolvePromise( data ) {
    let deferred = promiseCache.get( data.ref );

    if ( deferred && data.operation === 'SEND_ACK' ) {
      deferred.resolve( true );
      promiseCache.del( data.ref );
    }
  }

  /**
   * Sets the socket connection
   * @access protected
   */
  set _socket( socket ) {
    this._propSocket = socket;
  }

  /**
   * Creates a new instance of Logger with the specified scope
   * @param  {string} scope
   * @return {Logger}
   */
  scope( scope ) {
    let logger = new Logger( _.merge( this._opts, {
      scope
    } ) );

    logger._propSocket = this._socket;
    return logger;
  }

  static get DEFAULT_LOG_LEVELS() {
    return [
      'error',
      'warn',
      'info',
      'verbose',
      'debug',
      'silly'
    ];
  }
}
