'use strict';

import assert from 'assert';
import _      from 'lodash';
import zmq    from 'zmq';

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
