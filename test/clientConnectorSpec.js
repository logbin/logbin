'use strict';

var server;
var clientConnector = require( '../src/lib/clientConnector.js' );
var assert = require( 'assert' );

var socket = clientConnector.socket;
var reqClient = clientConnector.reqClient;

clientConnector.startConnecting();
describe( 'Client Connector', function() {

  it( 'should connect to outbound server', function( done ) {
    clientConnector.connectToOutbound();
    done();
  } );
} );
