'use strict';

var Logger = require( './dist/logger' );
Logger.LogStream = require( './dist/log-stream' );
Logger.LogDisplay = require( './dist/log-display' );

if ( process.argv.length == 3 )
{
  new Logger.LogDisplay( process.argv[ 2 ] ).show();
}

// Remove the following 2 lines when the
// server is already deployed.
var dummyZapLayer = require( './dist/dummy-auth-layer' );
dummyZapLayer.init();

module.exports = Logger;
