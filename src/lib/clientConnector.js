'use strict';

var zmq = require( 'zmq' );
var socket = new zmq.socket( 'dealer' );
var subscriber = new zmq.socket( 'dealer' );
var reqClient = new zmq.socket( 'req' );

exports.startConnecting = function( addr ) {
  var serverAddr = addr !== undefined ? addr : 'tcp://127.0.0.1:5555';
  socket.connect( serverAddr );
};

exports.connectToOutbound = function() {
  subscriber.connect( 'tcp://127.0.0.1:5557' );
};

exports.sendConnectionRequest = function() {
  var connectionRequest = {
    payload: {
      operation: 'connect',
      token: 'EkjFpCW0x'
    }
  };
  socket.send( JSON.stringify( connectionRequest ) );
};

exports.startHeartBeat = function() {
  var heartbeat = {
    payload: {
      operation: 'heartbeat'
    }
  };

  setInterval( () => {
    socket.send( JSON.stringify( heartbeat ) );
  }, 1000 );
};

exports.connectToOutboundReqClient = function() {
  reqClient.connect( 'tcp://127.0.0.1:5556' );
};

exports.socket = socket;
exports.subscriber = subscriber;
exports.reqClient = reqClient;
