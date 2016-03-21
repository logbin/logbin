'use strict';

var clientConnector = require( '../src/lib/clientConnector.js' );

clientConnector.startConnecting();
describe( 'Client Connector', function() {

  it( 'should connect to outbound server', function( done ) {
    clientConnector.connectToOutbound();
    done();
  } );
} );
