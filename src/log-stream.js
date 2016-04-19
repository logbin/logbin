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
      filter: {
        level: 'silly'
      }
    }, opts || {} );

    this._socket = zmq.socket( 'dealer' );

    // jscs: disable
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
      filter: this._opts.filter
    };

    this._socket.send( JSON.stringify( request ) );
  }

  set filter( filter ) {
    this._opts.filter = _.merge( {
      level: 'silly'
    }, filter || {} );
    this._subscribe();
  }

  get filter() {
    return this._opts.filter;
  }
}
