'use strict';

import assert       from 'assert';
import _            from 'lodash';
import net          from 'net';
import { inspect }  from 'util';
import Promise      from 'bluebird';
import NodeCache    from 'node-cache';
import uuid         from 'uuid';
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
   * @param { Object }  opts
   * @param { Boolean } opts.console
   * @param { String }  opts.store
   * @param { String }  opts.scope
   * @param { String }  opts.token
   * @param { Int }     opts.timeout
   * @param { Int }     opts.port
   * @param { String }  opts.host
   */
  constructor( loggerOpts, socketOpts ) {
    if ( !loggerOpts.console ) {
      assert( loggerOpts.store, `'store' is not specified` );
      assert( loggerOpts.token, `'token' is not specified` );
      assert( /(?!^_|^-)^[a-z0-9_-]+$/.test( loggerOpts.store ), `'store' invalid format` );
    }

    this._opts = _.merge( {}, {
      timeout: 5,
      port: 5555,
      host: 'localhost',
      scope: 'global',
      levels: Logger.DEFAULT_LOG_LEVELS,
      main: true
    }, loggerOpts );

    this._socketOpts = _.defaults( socketOpts, {
      authPhase: true,
      connected: false,
      socket: undefined
    } );

    let self = this;
    _.each( this._opts.levels, level => {
      this[ level ] = function() {
        let args = Array.from( arguments );
        args.unshift( level );
        return this.log.apply( self, args );
      };
    } );

    this._initSocket();
  }

  /**
   * Log
   * @access public
   * @param  { String } level
   * @param  { ...* }
   */
  log( level ) {
    assert( _.includes( this._opts.levels, level ), `'${level}' is not a log level` );

    let data = {
      '@level': level,
      '@scope': this._opts.scope,
      '@timestamp': new Date().toISOString()
    };

    let object = {};

    _.times( arguments.length - 1, ( index ) => {
      let arg = arguments[ index + 1 ];
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

    if ( !this._socketOpts.connected ) {
      return this._ack ? Promise.reject( `No server connection.` ) : null;
    }

    let deferred;

    if ( this._opts.console ) {
      console.log( data );
    } else {
      let request = {
        ref: this._ack ? uuid.v1() : undefined,
        operation: 'SEND',
        payload: data
      };

      if ( this._ack ) {
        deferred = new Promise.pending();
        promiseCache.set( request.ref, deferred, this._opts.timeout );
      }

      this._socketOpts.socket.write( request );
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
  _initSocket() {
    if ( this._opts.console || this._socketOpts.connected ) {
      return;
    }

    if ( !this._opts.main ) {
      return;
    }

    console.log( `Initiating socket connection to the server.` );

    let socket = net.connect( {
      port: this._opts.port,
      host: this._opts.host
    } );

    jsonEnable( socket, 'json' );

    socket.on( 'json', response => {
      this._handleResponse( response );
    } );

    socket.on( 'error', ( err ) => {
      console.log( `Logger socket has encountered a problem: ${ err }` );
    } );

    socket.on( 'close', () => {
      console.log( `Socket has been closed. Reconnecting...` );
      this._socketOpts.connected = false;
      this._socketOpts.authPhase = true;
      setTimeout( () => {
        this._initSocket();
      }, 3000 );
    } );

    /**
     * Send authentication request to server
     */
    socket.write( {
      ref: uuid.v1(),
      operation: 'AUTHENTICATE',
      entry: 'INBOUND',
      store: this._opts.store,
      token: this._opts.token
    } );

    this._socketOpts.socket = socket;
  }

  /**
   * Server response handler
   * @param { object } response
   */
  _handleResponse( response ) {
    if ( this._socketOpts.authPhase ) {
      if ( response.operation === 'AUTH_OK' ) {
        this._socketOpts.authPhase = false;
        this._socketOpts.connected = true;
        console.log( `Socket connected with valid token.` );
      } else if ( response.operation === 'AUTH_FAIL' ) {
        throw new Error( `Connection failed. ${response.error}` );
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
  _resolvePromise( response ) {
    if ( response.operation === 'INVALID_OPERATION' ) {
      console.log( `${ response.error }` );
      return;
    }

    let deferred = promiseCache.get( response.ref );

    if ( deferred && response.operation === 'SEND_ACK' ) {
      deferred.resolve( true );
      promiseCache.del( response.ref );
    }
  }

  /**
   * Creates a new instance of Logger with the specified scope
   * @param  {string} scope
   * @return {Logger}
   */
  scope( scope ) {
    assert( typeof scope === 'string', `${scope} is not a string.` );
    let logger = new Logger( _.merge( {}, this._opts, {
      scope: scope, main: false
    } ), this._socketOpts );

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
