'use strict';

import assert       from 'assert';
import zmq          from 'zmq';
import _            from 'lodash';
import EventEmitter from 'events';
import uuid         from 'uuid-js';

export default class LogStream extends EventEmitter {
  constructor( opts ) {
    super();

    assert( opts.store, `'store' is not specified` );
    assert( opts.token, `'token' is not specified` );

    this._opts = _.merge( {
      uri: 'tcp://127.0.0.1:5556',
      level: 'silly',
      levels: LogStream.DEFAULT_LOG_LEVELS,
      schema: {}
    }, opts || {} );

    this._socket = zmq.socket( 'dealer' );

    this._socket[ 'plain_password' ] = this._opts.token;

    this._socket.on( 'message', ( data ) => {
      let jsonData = JSON.parse( data.toString() );

      if ( jsonData.operation === 'SEND_LOG' ) {
        this.emit( 'log', jsonData.payload );
      }
    } );

    this._socket.connect( this._opts.uri );
    this._subscribe();
  }

  _subscribe() {
    let request = {
      ref: uuid.create( 1 ).toString(),
      operation: 'SUBSCRIBE',
      store: this._opts.store,
      level: this._opts.level,
      schema: this._opts.schema
    };

    this._socket.send( JSON.stringify( request ) );
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
