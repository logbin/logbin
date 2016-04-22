'use strict';

import 'babel-polyfill';
import 'co-mocha';
import assert	from 'assert';
import zmq	  from 'zmq';
import Logger  from '../index.js';

// Start a dummy inbound server
let router = zmq.socket( 'router' );
let uri = 'tcp://127.0.0.1:5555';

router.on( 'message', ( envelope, data ) => {
  let request = JSON.parse( data.toString() );

  if ( request.ref ) {
    let response = {
      ref: request.ref,
      operation: 'SEND_ACK'
    };

    // For test purposes, do not send a response with this condition
    if ( request.payload[ '@message' ] !== 'Do not send a response.' ) {
      router.send( [ envelope, JSON.stringify( response ) ] );
    }
  }
} );

// jscs: disable
router.plain_server = 1;
// jscs: enable

router.bind( uri );

describe( 'Testing Logger API', () => {
  let loggerConfig = {
    uri: uri,
    token: 'EkjFpCW0x',
    store: 'clint',
    console: false
  };

  let logger = new Logger( loggerConfig );

  it( 'should return a promise when ack() is used.', function *() {
    let result = yield logger.ack().error( 'I am sending an error.' );
    assert( result, `should be resolved` );
  } );

  it( 'should send a log with object data', function *() {
    return logger.ack().log( 'error', { name: 'Clint', age: '23' } )
      .then( function fulfilled( result ) {
        assert.equal( result, result );
      } );
  } );

  it( 'should return a server response failed', function *() {
    this.timeout( 7000 );
    return logger.ack().info( 'Do not send a response.' ).then( function fulfilled( result ) {
      throw new Error( 'Promise unexpectedly fulfilled. Result: ' + result );
    }, function rejected( error ) {
      assert.equal( error, error );
    } );
  } );

  it( 'should return a new instance of logger', function *() {
    let tempLogger = logger.scope( 'temp' );
    let result1 = yield tempLogger.ack().error( 'I am sending an error in scope temp.' );
    let result2 = yield tempLogger.ack().log( 'error', { name: 'Clint', age: '23' } );
    assert( result1, `should be resolved` );
    assert( result2, `should be resolved` );
  } );

} );
