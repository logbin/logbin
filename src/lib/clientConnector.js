'use strict';

var zmq = require( 'zmq' );
var inboundClient = zmq.socket( 'dealer' );
var outboundClient = zmq.socket( 'dealer' );

module.exports = {
  inbound: inboundClient,
  outbound: outboundClient
};
