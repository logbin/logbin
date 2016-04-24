var Logger = require( './dist/logger' );
Logger.LogStream = require( './dist/log-stream' );

module.exports = Logger;

// Remove the following 2 lines when the
// server is already deployed.
// var dummyZapLayer = require( './dist/dummy-auth-layer' );
// dummyZapLayer.init();
