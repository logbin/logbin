'use strict';

var Logbin = require( '../index.js' );

var logger = new Logbin( {
  store: 'clients',
  token: 'EkjFpCW0x'
} );

//New instance of a logger with a set scope
var newLogger = logger.scope( 'global' );
newLogger.log( 'info', { id:1234, name: 'Jeff', age:99 } );
