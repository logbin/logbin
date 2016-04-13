'use strict';
require( 'babel-polyfill' );
require( 'co-mocha' );

var assert = require( 'assert' );
var zmq = require( 'zmq' );
var Q = require( 'q' );

var uri = 'tcp://127.0.0.1:5556';

// Start dummy outbound server
var router = zmq.socket( 'router' );

// jscs: disable
router.plain_server = 1;
// jscs: enable
router.bind( uri );

var clientIdentity;
router.on( 'message', ( envelope, data ) => {
  clientIdentity = envelope;
  let jsonRequest = JSON.parse( data.toString() );
  let response = {
    ref: jsonRequest.ref,
    operation: 'SUBSCRIBE_ACK'
  };
  router.send( [ envelope, JSON.stringify( response ) ] );
} );

describe( 'Testing Realtime Logstream API', () => {
  var config = {
    uri: uri,
    token: 'EkjFpCW0x',
    store: 'test',
    filter: {
      level: 'error'
    }
  };

  var realtime = require( '../dist/index.js' ).realtime( config );

  it( 'should support chaining of non-returning methods', function() {
    let newFilter = {
      level: 'info',
      fields: {
        name: 'Christopher',
        age: 23
      }
    };
    realtime
      .setStore( 'testing' )
      .setFilter( newFilter );

    assert.equal( realtime.store, 'testing' );
    assert.equal( JSON.stringify( realtime.filter ), JSON.stringify( newFilter ) );
  } );

  it( 'should return a resolved promise on subscribe method', function *() {
    let result = yield realtime.subscribe();
    assert.equal( result.operation, 'SUBSCRIBE_ACK' );
  } );

  // For testing purposes, we send a log from dummy server
  // to client. The promise returned should be resolved
  // on realtime.on( 'log' ) event.
  // In this test, we do not consider the functionality
  // of filters yet. It is only to test whether
  // the eventemitter fires on log event when the server
  // sends a log to the client
  var deferred = Q.defer();
  it( 'should trigger the realtime.on log event', function *() {
    let anyLog = {
      operation: 'SEND_LOG',
      payload: {
        '@message': 'Just a usual log.',
        '@pscope': 'server',
        '@level': 'silly',
        '@timestamp': 'April 11 16:33:30'
      }
    };

    let result = yield routerSendToClient( anyLog );
    assert.equal( result.operation, 'SEND_LOG' );
  } );

  function routerSendToClient ( data ) {

    // The clientIdentity here should already
    // be set after we have called on the
    // subscribe method
    router.send( [ clientIdentity, JSON.stringify( data ) ] );
    return deferred.promise;
  }

  realtime.on( 'log', ( logObject ) => {
    deferred.resolve( logObject );
  } );
} );
