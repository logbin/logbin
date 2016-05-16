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

    if ( request.operation === 'AUTHENTICATE' ) {
      response.operation = 'AUTH_OK';
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
    port: 5556,
    token: 'EkjFpCW0x',
    store: 'log-stream-test'
  };

  let realtime = new LogStream( config );

  /**
   * For testing purposes, we send a log from dummy server
   * to this outbound client. The promise returned should
   * be resolved on realtime.on( 'log' ) event.
   */

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
