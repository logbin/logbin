'use strict';

var co = require( 'co' );
var logbin = require( './' );

var config = {
  uri: 'tcp://127.0.0.1:5556',
  store: 'test',
  token: 'EkjFpCW0x'
};

var realtime = logbin.realtime( config );

co( function *() {
  yield realtime.subscribe();
} )
.catch( error => console.log( error ) );

realtime.on( 'log', data => console.log( data ) );
