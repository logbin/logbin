'use strict';

var Logbin = require( '../index.js' );

var logger = new Logbin.logger( {
  store: 'clients',
  token: 'EkjFpCW0x',
  console: true
} );

logger.log( 'this log message will be sent directly to the console' );
