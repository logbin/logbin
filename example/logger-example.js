'use strict';

var Logger = require( '../dist/index.js' );
var co = require( 'co' );

var config = {
  uri: 'tcp://127.0.0.1:5556',
  token: 'EkjFpCW0x',
  store: 'test',
  filter: {
    level: 'info'
  }
};

var opts = {
  store: 'test',
  token:'EkjFpCW0x',
  transports:[ 'tcp' ]
};

var myLogger = new Logger.logger( opts );

Logger.realtime( config ).on( 'log', ( data ) => {
  console.log( data );
} );

setInterval( () => {
  myLogger.ack().log( 'error', { name: 'Jefferson D. Miralles', wants:'anything' } ).then( console.log );
}, 1000 );
