'use strict';

var clientConnector = require( './clientConnector.js' );
var logDisplay = require( './logDisplay.js' );
var parseArgs = require( 'minimist' );
var prettyjson = require( 'prettyjson' );
var subscriber = clientConnector.subscriber;
var reqClient = clientConnector.reqClient;

clientConnector.connectToOutbound();
clientConnector.connectToOutboundReqClient();
var args = parseArgs( process.argv );

var subscriptionStrings = logDisplay.getSubscriptionStrings( args.store, args.scope, args.level );
console.log( subscriptionStrings );
var requestToSetFilter = {
  operation: 'set',
  dataFilter: {
    mode: 'all'
  }
};

if ( args.filter ) {
  if ( args.filter.mode === undefined ) {
    args.filter.mode = 'all';
  }

  requestToSetFilter.dataFilter = args.filter;
}

reqClient.send( JSON.stringify( requestToSetFilter ) );

reqClient.on( 'message', ( response ) => {
  let responseObject = JSON.parse( response.toString() );
  let uuid = responseObject.uuid;

  if ( responseObject.operation === 'ack_set' ) {
    subscriptionStrings.forEach( ( topic ) => {
      subscriber.subscribe( topic + uuid );
    } );
  } else if ( responseObject.operation === 'ack_del' ) {
    console.log( 'delete filter' );
  }
} );

subscriber.on( 'message', function( topic, data ) {
  if ( args.pretty ) {
    console.log( prettyjson.render( JSON.parse( data.toString() ) ) + '\n------------------' );
  } else {
    console.log( data.toString() );
  }
} );
