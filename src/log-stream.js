'use strict';

import assert       from 'assert';
import net          from 'net';
import _            from 'lodash';
import EventEmitter from 'events';
import uuid         from 'node-uuid';
import jsonEnable   from './json-socket';

export default class LogStream extends EventEmitter {
  constructor( opts ) {
    super();

    assert( opts.store, `'store' is not specified` );
    assert( opts.token, `'token' is not specified` );
    assert( /(?!^_|^-)^[a-z0-9_-]+$/.test( opts.store ), `'store' invalid format` );

    this._opts = _.defaults( opts, {
      port: 5555,
      host: 'localhost',
      level: 'silly',
      levels: LogStream.DEFAULT_LOG_LEVELS,
      schema: {}
    } );

    this._propSocket = this._socket;
  }

  _subscribe() {
    let request = {
      ref: uuid.v1(),
      operation: 'SUBSCRIBE',
      level: this._opts.level,
      schema: this._opts.schema
    };
    this._propSocket.write( request );
  }

  set _socket( socket ) {
    this._propSocket = socket;
  }

  get _socket() {
    if ( !this._propSocket ) {
      let socket = net.connect( {
        port: this._opts.port,
        host: this._opts.host
      } );

      jsonEnable( socket );

      socket.on( 'SEND_LOG', data => this._handleLogs( data ) );

      socket.on( 'AUTH_OK', () => {
        this._authorized = true;
        this._subscribe();
      } );

      socket.on( 'AUTH_FAIL', data => {
        console.log( `Connection failed. ${ data.error }` );
      } );

      socket.on( 'INVALID_OPERATION', data => {
        console.log( `${ data.error }` );
      } );

      socket.on( 'error', ( err ) => {
        console.log( `Logger socket has encountered a problem: ${ err }` );
      } );

      socket.on( 'close', () => {
        console.log( `Socket has been closed.` );
      } );

      socket.write( {
        ref: uuid.v1(),
        operation: 'AUTHENTICATE',
        entry: 'OUTBOUND',
        store: this._opts.store,
        token: this._opts.token
      } );

      this._propSocket = socket;
    }
    return this._propSocket;
  }

  _handleLogs( data ) {
    this.emit( 'log', data.payload );
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
