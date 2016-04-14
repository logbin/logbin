'use strict';

let clientConnector = require( './clientConnector.js' );
let logDisplay = require( './logDisplay.js' );
let parseArgs = require( 'minimist' );
let prettyjson = require( 'prettyjson' );
let subscriber = clientConnector.subscriber;
let reqClient = clientConnector.reqClient;

clientConnector.connectToOutbound();
clientConnector.connectToOutboundReqClient();
let args = parseArgs( process.argv );

let subscriptionStrings = logDisplay.getSubscriptionStrings( args.store, args.scope, args.level );
console.log( subscriptionStrings );
let requestToSetFilter = {
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
