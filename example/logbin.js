'use strict';

var Logbin = require( '../index.js' );

var logger = new Logbin( {
  store: 'clients',
  token: 'EkjFpCW0x'
} );

logger.log( 'Hello, this is a information.' );
logger.log( { name: 'Voltron', age: 99 } );

//Set default level to error
logger.level = 'error';
logger.log( 'An Error Occurred.' );
