'use strict';

var Logger = require( '../index.js' );
var co = require( 'co' );

/*
var config = {
   uri: 'tcp://127.0.0.1:5556',
   token: 'EkjFpCW0x',
   store: 'test',
   filter: {
     level: 'info'
   }
 };
 */

var opts = {
  store: 'test',
  token:'EkjFpCW0x',
  console: false
};

var myLogger = new Logger.logger( opts );

setInterval( () => {
  myLogger.ack().log( 'error', { name: 'Jefferson D. Miralles', wants:'anything' } ).then( console.log );
}, 1000 );

var newLogger = myLogger.scope( 'global' );
setInterval( () => {

  newLogger.ack().log( 'error', { name: 'Jefferson D. Miralles', wants:'anything' } ).then( console.log );
}, 1000 );
