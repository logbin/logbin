'use strict';

import assert         from 'assert';
import Promise        from 'bluebird';
import net            from 'net';
import { LogStream }  from '../index';
import jsonEnable     from '../dist/json-socket';
import 'babel-polyfill';
import 'co-mocha';

// Start dummy outbound server
let server = net.createServer().listen( 5556, 'localhost' );
let _socket;
server.on( 'connection', socket => {
  jsonEnable( socket, 'json' );
  _socket = socket;
  socket.on( 'json', request => {
    let response = {
      ref: request.ref
    };

    if ( request.operation === 'CONNECT' ) {
      response.operation = 'CONN_ACK';
      response.success = true;
    }

    if ( request.operation === 'SUBSCRIBE' ) {
      response.operation = 'SUBSCRIBE_ACK';
    }

    socket.write( response );
  } );
} );

let deferred;
function sendToOutboundClient ( request ) {
  deferred = new Promise.pending();
  _socket.write( request );
  return deferred.promise;
}

describe( 'Testing Realtime Logstream API', () => {
  let config = {
    token: 'EkjFpCW0x',
    store: 'log-stream-test'
  };

  let realtime = new LogStream( config );

  it( 'schema value should change from default to new input', () => {
    let defaultSchema = realtime.schema;
    let newSchema = {
      properties: {
        age: { type: 'number', maximum: 23 }
      }
    };
    realtime.schema = newSchema;

    assert.equal( JSON.stringify( defaultSchema ), JSON.stringify( {} ) );
    assert.equal( JSON.stringify( realtime.schema ), JSON.stringify( newSchema ) );
  } );

  it( 'level value should change from default to new input', () => {
    let defaultLevel = realtime.level;
    realtime.level = 'error';

    assert.equal( defaultLevel, 'silly' );
    assert.equal( realtime.level, 'error' );
  } );

  // For testing purposes, we send a log from dummy server
  // to client. The promise returned should be resolved
  // on realtime.on( 'log' ) event.
  // In this test, we do not consider the functionality
  // of filters yet. It is only to test whether
  // the eventemitter fires on log event when the server
  // sends a log to the client

  realtime.on( 'log', ( logObject ) => {
    setTimeout( () => {
      deferred.resolve( logObject );
    }, 1000 );
  } );

  it( 'should trigger the realtime.on log event', function *() {
    this.timeout( 5000 );
    let anyLog = {
      operation: 'SEND_LOG',
      payload: {
        '@message': 'Just a usual log.',
        '@scope': 'server',
        '@level': 'silly',
        '@timestamp': new Date().toISOString()
      }
    };

    let result = yield sendToOutboundClient( anyLog );
    assert.equal( JSON.stringify( result ), JSON.stringify( anyLog.payload ) );
  } );

} );
