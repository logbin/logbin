'use strict';
require( 'babel-polyfill' );
require( 'co-mocha' );

var assert = require( 'assert' );
var zmq = require( 'zmq' );
var zmqzap = require( 'zmq-zap' );
var ZAP = zmqzap.ZAP;
var PlainMechanism = zmqzap.PlainMechanism;
var zap = new ZAP();

// Start authentication layer
zap.use( new PlainMechanism( ( data, callback ) => {
  callback( null, true ); // Just grant all connections
} ) );

var zapSocket = zmq.socket( 'router' );
zapSocket.on( 'message', function() {
  zap.authenticate( arguments, ( err, response ) => {
    if ( err ) { console.error( 'Error:', err ); }
    if ( response ) { zapSocket.send( response ); }
  } );
} );
zapSocket.bindSync( 'inproc://zeromq.zap.01' );

// Start a dummy inbound server
var router = zmq.socket( 'router' );
var uri = 'tcp://127.0.0.1:5555';

// jscs: disable
router.plain_server = 1;
// jscs: enable
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
    noPassword: true,
    uri: uri,
    token: 'EkjFpCW0x',
    transports: [ 'tcp' ],
    store: 'clint',
    scope: 'server',
    requestTTL: 5000
  };

  var logger = require( '../dist/index.js' ).logger( loggerConfig );

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

  it( 'should send a log with single parameter passed', function *() {
    let result = yield logger.log( 'This is just a single argument' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should return a server response failed', function *() {
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
    return logger.log().then( function fulfilled( result ) {
      throw new Error( 'Promise unexpectedly fulfilled. Result: ' + result );
    }, function rejected( error ) {
      assert.equal( error.code, 'EMISSINGARG' );
    } );
  } );
} );
