'use strict';

import assert         from 'assert';
import zmq            from 'zmq';
import Promise        from 'bluebird';
import { LogStream }  from '../index';
import 'babel-polyfill';
import 'co-mocha';

let uri = 'tcp://127.0.0.1:5556';

// Start dummy outbound server
let router = zmq.socket( 'router' );
router[ 'plain_server' ] = 1;

let clientIdentity;
router.on( 'message', ( envelope, data ) => {
  clientIdentity = envelope;
  let jsonRequest = JSON.parse( data.toString() );
  let response = {
    ref: jsonRequest.ref,
    operation: 'SUBSCRIBE_ACK'
  };
  router.send( [ envelope, JSON.stringify( response ) ] );
} );

router.bind( uri );

describe( 'Testing Realtime Logstream API', () => {
  let config = {
    uri: uri,
    token: 'EkjFpCW0x',
    store: 'test'
  };

  let realtime = new LogStream( config );

  it( 'schema value should change from default to new input', function() {
    let defaultSchema = realtime.schema;
    let newSchema = {
      type: 'object',
      properties: {
        age: { type: 'number', maximum: 23 }
      }
    };
    realtime.schema = newSchema;

    assert.equal( JSON.stringify( defaultSchema ), JSON.stringify( {} ) );
    assert.equal( JSON.stringify( realtime.schema ), JSON.stringify( newSchema ) );
  } );

  it( 'level value should change from default to new input', function() {
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
  let deferred = Promise.pending();

  realtime.on( 'log', ( logObject ) => {
    deferred.resolve( logObject );
  } );

  it( 'should trigger the realtime.on log event', function *() {
    let anyLog = {
      operation: 'SEND_LOG',
      payload: {
        '@message': 'Just a usual log.',
        '@scope': 'server',
        '@level': 'silly',
        '@timestamp': 'April 11 16:33:30'
      }
    };

    let result = yield routerSendToClient( anyLog );
    assert.equal( JSON.stringify( result ), JSON.stringify( anyLog.payload ) );
  } );

  function routerSendToClient ( data ) {

    // The clientIdentity here should already
    // be set after we have called on the
    // subscribe method
    router.send( [ clientIdentity, JSON.stringify( data ) ] );
    return deferred.promise;
  }

} );
