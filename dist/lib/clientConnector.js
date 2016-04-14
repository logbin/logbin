'use strict';

var zmq = require('zmq');
var inboundClient = zmq.socket('dealer');
var outboundClient = zmq.socket('dealer');

outboundClient.monitor(500, 0);
inboundClient.monitor(500, 0);

module.exports = { 
  inbound: inboundClient, 
  outbound: outboundClient };