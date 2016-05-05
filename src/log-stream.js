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

    this._opts = _.defaults( opts, {
      port: 5556,
      host: 'localhost',
      level: 'silly',
      levels: LogStream.DEFAULT_LOG_LEVELS,
      schema: {}
    } );

    this._propSocket = this._socket;
    this._subscribe();
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
        port: this._opts.port || 5556,
        host: this._opts.host || 'localhost'
      } );

      jsonEnable( socket, 'json' );

      socket.on( 'json', data => {
        if ( data.operation === 'SEND_LOG' ) {
          this.emit( 'log', data.payload );
        }
      } );

      socket.write( {
        ref: uuid.v1(),
        operation: 'CONNECT',
        store: this._opts.store,
        token: this._opts.token
      } );

      this._propSocket = socket;
    }
    return this._propSocket;
  }

  set schema( schema ) {
    assert( typeof schema === 'object', `'schema' should be an object` );
    this._opts.schema = schema;
    this._subscribe();
  }

  get schema() {
    return this._opts.schema;
  }

  set level( level ) {
    assert( _.includes( this._opts.levels, level ), `'${level}' is not a log level` );
    this._opts.level = level;
    this._subscribe();
  }

  get level() {
    return this._opts.level;
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
