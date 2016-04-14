'use strict';

import assert      from 'assert';
import _           from 'lodash';
import zmq         from 'zmq';
import { inspect } from 'util';
import Promise     from 'bluebird';

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
      levels: Logger.DEFAULT_LOG_LEVELS
    }, opts || {} );

    let self = this;

    _.each( this._opts.levels, level => {
      this[ level ] = function() {
        let args = Array.prototype.slice.call( arguments );
        args.unshift( level );
        self.log.apply( self, args );
      };
    } );

  }

  /**
   * Log
   * @access public
   * @param  {string} level
   * @param  {...*}
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
        if ( !object.message ) {
          object.message = [];
        } else {
          object.message = [ object.message ];
        }
        object.message.push( ( typeof arg === 'string' ) ? arg : inspect( arg ) );
        object.message = object.message.join( ' ' );
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
    if ( this._opts.console ) {
      console.log( data );
    } else {
      if ( this._ack ) {
        return Promise.resolve();
      }
    }

    this._ack = false;
  }

  /**
   * Sets the socket connection
   * @access protected
   */
  get _socket() {
    if ( !this._opts.console && !this._socket ) {
      let socket = zmq.socket( 'dealer' );
      socket.connect( this._opts.uri || 'tcp://127.0.0.1:5555' );
      this._socket = socket;
    }
    return this._socket;
  }

  /**
   * Sets the socket connection
   * @access protected
   */
  set _socket( socket ) {
    this._socket = socket;
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

    logger._socket = this._socket;
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
