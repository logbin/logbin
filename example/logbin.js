'use strict';

var Logbin = require( '../index.js' );

var logger = new Logbin.logger( {
  store: 'clients',
  token: 'EkjFpCW0x'
} );

logger.log( 'Hello, this is a information.' );
logger.log( { name: 'Voltron', age: 99 } );
