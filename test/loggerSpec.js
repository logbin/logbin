'use strict';
var assert = require( 'assert' );
var dateFormat = require( 'dateformat' );
describe( 'Testing Logger API', function() {
  var logger = require( '../src/lib/logger.js' )( 'VoltronChronicles' );
  var socket = logger.socket;

  it( 'should create a logger default object', function( done ) {
    assert.equal( typeof logger, 'object' );
    assert.equal( logger.level, 'info' );
    assert.equal( typeof logger.time, 'function' );
    assert.equal( logger.pscope, 'server' );
    assert.equal( logger.store, 'VoltronChronicles' );
    done();
  } );

  it( 'should change the default properties of the default object', function( done ) {
    logger.level = 'debug';
    logger.pscope = 'server2';
    logger.time = function() {
      return new Date().toISOString();
    };

    var firstDate = logger.time();
    assert.equal( logger.pscope, 'server2' );
    assert.equal( logger.level, 'debug' );

    assert.equal( typeof firstDate, 'string' ); //Problem with delay
    done();
  } );

  it( 'should acknowledge server response', function( done ) {
    var sendLogRequest = {
      operation: 'send',
      store: 'VoltronChronicles',
      pdata: 'Voltron used laser sword.',
      scope: 'Battle',
      level: 'silly',
      timestamp: dateFormat( 'mmmm dd HH:MM:ss' )
    };

    var expectedSendLogRequestReceipt = {
      ref: 4501,
      payload: {
        operation: 'req_receipt'
      }
    };

    logger.log( 'silly', sendLogRequest, function( err ) {
      assert.equal( err, undefined );
      socket.on( 'message', function( response ) {
        assert.equal( response.toString(), JSON.stringify( expectedSendLogRequestReceipt ) );
      } );

      done();
    } );
  } );

  it( 'should create a default instance and sends a log', function( done ) {
    logger.log( 'info', 'Hello World!', function( err ) {
      assert.equal( err, undefined );
      done();
    } );
  } );

  it( 'should return instance of logger', function( done ) {
    var loggerRet = logger.info( 'Hello Bob' );
    assert.equal( logger, loggerRet );
    done();
  } );

  it( 'should change the logger scope property', function( done ) {
    logger.scope( 'Game' );
    assert.equal( logger.pscope, 'Game' );
    done();
  } );

} );
