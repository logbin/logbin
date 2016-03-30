'use strict';

var clientConnector = require( '../src/lib/clientConnector.js' );

clientConnector.startConnecting( 'tcp://127.0.0.1:5555' );
describe( 'Client Connector', function() {

  it( 'should connect to outbound server', function( done ) {
    clientConnector.connectToOutbound();
    done();
  } );
} );
