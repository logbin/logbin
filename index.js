var Logger = require( './dist/logger' );
Logger.LogStream = require( './dist/log-stream' );

module.exports = Logger;

// Start dummy authentication layer.
// Remove this when server is already deployed.

var zmqzap = require( 'zmq-zap' );
var zmq = require( 'zmq' );

var ZAP = zmqzap.ZAP,
  PlainMechanism = zmqzap.PlainMechanism,
  zap = new ZAP();

// Start authentication layer
zap.use( new PlainMechanism( ( data, callback ) => {
  callback( null, true ); // Just grant all connections
} ) );

var zapSocket = zmq.socket( 'router' );
zapSocket.on( 'message', function() {
  zap.authenticate( arguments, ( err, response ) => {
    if ( err ) { console.error( 'Error:', err ); }
    if ( response ) { zapSocket.send( response ); }
  } );
} );
zapSocket.bindSync( 'inproc://zeromq.zap.01' );
