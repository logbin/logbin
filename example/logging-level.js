'use strict';

var Logbin = require( '../index.js' );

var logger = new Logbin( {
  store: 'clients',
  token: 'EkjFpCW0x'
} );

logger.log( 'warn', 'WARNING there is no spoon!' );
logger.warn( 'Another warn log message.' );
