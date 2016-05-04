'use strict';

var Logger = require( './dist/logger' );
Logger.LogStream = require( './dist/log-stream' );
Logger.LogDisplay = require( './dist/log-display' );

if ( process.argv.length == 3 )
{
  new Logger.LogDisplay( process.argv[ 2 ] ).show();
}

module.exports = Logger;
