'use strict';

import 'babel-polyfill';
import 'co-mocha';
import assert	    from 'assert';
import net        from 'net';
import Logger     from '../';
import jsonEnable from '../dist/json-socket';

// Start a dummy inbound server
let server = net.createServer().listen( 5555, 'localhost' );
server.on( 'connection', socket => {
  jsonEnable( socket, 'json' );
  socket.on( 'json', request => {
    let response = {
      ref: request.ref
    };

    if ( request.operation === 'CONNECT' ) {
      response.operation = 'CONN_ACK';
      response.success = true;
    }

    if ( request.operation === 'SEND_LOG' ) {
      response.operation = 'SEND_ACK';
    }

    let doNotReply;
    if ( request.operation === 'SEND_LOG' ) {
      doNotReply = request.payload[ '@message' ] === 'Do not send a response.';
    }

    if ( !doNotReply ) {
      socket.write( response );
    }

  } );
} );

describe( 'Testing Logger API', () => {
  let loggerConfig = {
    port: 5555,
    host: 'localhost',
    token: 'EkjFpCW0x',
    store: 'clint',
    console: false
  };

  let logger = new Logger( loggerConfig );

  it( 'should return a promise when ack() is used.', function *() {
    let result = yield logger.ack().error( `I am sending an error.` );
    assert( result, `should be resolved` );
  } );

  it( 'should send a log with object data', function *() {
    return logger.ack().log( 'error', { name: 'Clint', age: '23' } )
      .then( ( result ) => {
        assert( result );
      } );
  } );

  it( 'should return a server response failed', function *() {
    this.timeout( 7000 );
    return logger.ack().info( `Do not send a response.` ).then( ( result ) => {
      throw new Error( `Promise unexpectedly fulfilled. Result: ${result}` );
    }, ( error ) => {
      assert.equal( error, error );
    } );
  } );

  it( 'should return a new instance of logger', function *() {
    let tempLogger = logger.scope( 'temp' );
    let result1 = yield tempLogger.ack().error( `I am sending an error in scope temp.` );
    let result2 = yield tempLogger.ack().log( 'error', { name: 'Clint', age: '23' } );
    assert( result1, `should be resolved` );
    assert( result2, `should be resolved` );
  } );

} );
