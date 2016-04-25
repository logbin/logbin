'use strict';

import assert       from 'assert';
import _            from 'lodash';
import zmq          from 'zmq';
import { inspect }  from 'util';
import Promise      from 'bluebird';
import NodeCache    from 'node-cache';
import uuid         from 'uuid-js';

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
   * @param  {object}  opts
   * @param  {boolean} opts.console
   * @param  {string}  opts.store
   * @param  {string}  opts.scope
   * @param  {string}  opts.token
   * @param  {number}  opts.timeout
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
        operation: 'SEND',
        store: this._opts.store,
        payload: data
      };

      if ( this._ack ) {
        deferred = new Promise.pending();
        promiseCache.set( request.ref, deferred, this._opts.timeout );
      }

      this._propSocket.send( JSON.stringify( request ) );

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
      let socket = zmq.socket( 'dealer' );
      socket[ 'plain_password' ] = this._opts.token;

      socket.on( 'message', data => {
        this._resolvePromise( JSON.parse( data.toString() ) );
      } );

      socket.connect( this._opts.uri || 'tcp://127.0.0.1:5555' );
      this._propSocket = socket;
    }
    return this._propSocket;
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
