'use strict';
var assert = require( 'assert' );
var zmq = require( 'zmq' );
require( 'co-mocha' );

// Start a dummy server
var router = zmq.socket( 'router' );
var uri = 'tcp://127.0.0.1:5555';
router.bind( uri );

router.on( 'message', ( envelope, data ) => {
  let request = JSON.parse( data.toString() );
  let response = {
    ref: request.ref,
    operation: 'SEND_ACK'
  };

  // For test purposes, do not send a response with this condition
  if ( request.payload[ '@message' ] !== 'Do not send a response.' ) {
    router.send( [ envelope, JSON.stringify( response ) ] );
  }
} );

describe( 'Testing Logger API', () => {
  var loggerConfig = {
    uri: uri,
    store: 'clint',
    scope: 'server',
    requestTTL: 5000
  };

  var logger = require( '../src/index.js' )( loggerConfig );

  it( 'should support chaining for non-returning methods', function() {
    logger
      .setStore( 'teststore' )
      .setScope( 'app' )
      .setRequestTTL( 1 );

    assert.equal( logger.store, 'teststore' );
    assert.equal( logger.scope, 'app' );
    assert.equal( logger.requestTTL, 1 );
  } );

  it( 'should send an error and return a promise', function *() {
    let result = yield logger.error( 'I am sending an error.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a warn and return a promise', function *() {
    let result = yield logger.warn( 'I am sending a warn.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send an info and return a promise', function *() {
    let result = yield logger.info( 'I am sending a log.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a verbose and return a promise', function *() {
    let result = yield logger.verbose( 'I am sending a verbose.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a debug and return a promise', function *() {
    let result = yield logger.debug( 'I am sending a debug.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a silly and return a promise', function *() {
    let result = yield logger.silly( 'I am sending a silly.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a log with object data', function *() {
    let result = yield logger.log( 'error', { name: 'Clint', age: '23' } );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a server response failed', function *() {
    this.timeout( 7000 );
    return logger.info( 'Do not send a response.' ).then( function fulfilled( result ) {
      throw new Error( 'Promise unexpectedly fulfilled. Result: ' + result );
    }, function rejected( error ) {
      assert.equal( error.code, 'ENORESPONSE' );
    } );
  } );

  it( 'should return invalid level input', function *() {
    return logger.log( 'nolevellikethis', 'This is a test, obviously.' ).then( function fulfilled( result ) {
      throw new Error( 'Promise unexpectedly fulfilled. Result: ' + result );
    }, function rejected( error ) {
      assert.equal( error.code, 'ELEVELINVALID' );
    } );
  } );

  it( 'should return missing log argument', function *() {
    return logger.log( 'info' ).then( function fulfilled( result ) {
      throw new Error( 'Promise unexpectedly fulfilled. Result: ' + result );
    }, function rejected( error ) {
      assert.equal( error.code, 'EMISSINGARG' );
    } );
  } );
} );
