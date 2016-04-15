'use strict';

import 'babel-polyfill';
import 'co-mocha';
import assert	from 'assert';
import zmq	from 'zmq';
import zmqzap	from 'zmq-zap';
import index	from '../dist/index.js';

let ZAP = zmqzap.ZAP,
  PlainMechanism = zmqzap.PlainMechanism,
  zap = new ZAP();

// Start authentication layer
zap.use( new PlainMechanism( ( data, callback ) => {
  callback( null, true ); // Just grant all connections
} ) );

let zapSocket = zmq.socket( 'router' );
zapSocket.on( 'message', function() {
  zap.authenticate( arguments, ( err, response ) => {
    if ( err ) { console.error( 'Error:', err ); }
    if ( response ) { zapSocket.send( response ); }
  } );
} );
zapSocket.bindSync( 'inproc://zeromq.zap.01' );

// Start a dummy inbound server
let router = zmq.socket( 'router' ),
  uri = 'tcp://127.0.0.1:5555';

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
  let loggerConfig = {
    noPassword: true,
    uri: uri,
    token: 'EkjFpCW0x',
    transports: [ 'tcp' ],
    store: 'clint',
    scope: 'server',
    requestTTL: 5000
  };

  let logger = index.logger( loggerConfig );

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
    let result = yield logger.ack().error( 'I am sending an error.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a warn and return a promise', function *() {
    let result = yield logger.ack().warn( 'I am sending a warn.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send an info and return a promise', function *() {
    let result = yield logger.ack().info( 'I am sending a log.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a verbose and return a promise', function *() {
    let result = yield logger.ack().verbose( 'I am sending a verbose.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a debug and return a promise', function *() {
    let result = yield logger.ack().debug( 'I am sending a debug.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a silly and return a promise', function *() {
    let result = yield logger.ack().silly( 'I am sending a silly.' );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a log with object data', function *() {
    let result = yield logger.ack().log( 'error', { name: 'Clint', age: '23' } );
    assert.equal( result.operation, 'SEND_ACK' );
  } );

  it( 'should send a log with single parameter passed', function *() {
    let result = yield logger.ack().log( 'This is just a single argument' );
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
