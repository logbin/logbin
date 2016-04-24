'use strict';

var Logbin = require( '../index.js' );

var logger = new Logbin( {
  store: 'clients',
  token: 'EkjFpCW0x'
} );

//This returns a promise by using 'ack' method
logger.ack().log( 'Hello, this is a information.' ).then( console.log );
