'use strict';

let zmq = require( 'zmq' );
let inboundClient = zmq.socket( 'dealer' );
let outboundClient = zmq.socket( 'dealer' );

outboundClient.monitor( 500, 0 );
inboundClient.monitor( 500, 0 );

module.exports = {
  inbound: inboundClient,
  outbound: outboundClient
};
