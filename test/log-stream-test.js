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
    store: 'log-stream-test',
    fields: [ 'name', 'status' ]
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

  it( 'Should return fields given in config', function() {
    assert.equal( realtime.fields, config.fields );
  } );

  it( 'Should trigger the realtime.on log event', function *() {
    this.timeout( 5000 );
    let anyLog = {
      operation: 'SEND_LOG',
      payload: {
        name: 'Zaifel',
        address: 'Butuan City',
        status: 'Single',
        '@scope': 'server',
        '@level': 'silly',
        '@timestamp': new Date().toISOString()
      }
    };

    let result = yield sendToOutboundClient( anyLog );
    assert( result.name === 'Zaifel', `Name should be equal` );
    assert( result.status === 'Single', `Status should be equal` );
    assert( !result.address, `Address should not be included` );
  } );

} );
