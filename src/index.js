'use strict';

var clientConnector = require( './lib/clientConnector.js' );
var severities = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
var dateFormat = require( 'dateformat' );
var logStream = require( './lib/logStream.js' );
var socket = clientConnector.socket;
var pscope;
var message;

var Logger = function( opts ) {
  var store = opts.store;
  var uri = opts.uri !== undefined ? opts.uri : 'tcp://127.0.0.1:5555';
  clientConnector.startConnecting( uri );
  clientConnector.connectToOutbound();

  clientConnector.sendConnectionRequest();
  clientConnector.startHeartBeat();

  socket.on( 'message', ( data ) => {
    console.log( data.toString() );
  } );

  return {
    level: severities[ 2 ],

    time: function() {
      return new Date();
    },

    pscope: 'server',
    store: store,

    info: function( message ) {
      this.level = severities[ 2 ];
      this.log( 'info', message, function() {

      } );

      return this;
    },

    scope: function( msg ) {
      this.pscope = msg;
      return this;
    },

    log: function( sevLevel, options, callback ) {
      if ( options === undefined ) {
        callback( 'sevLevel and message must not be undefined.' );
        return;
      }

      if ( typeof options !== 'string' ) {
        this.pscope = options.scope !== undefined ? options.scope : 'server';
        message = options;
      } else {
        pscope = ( options.scope !== undefined ) ? options.scope : 'server';
        message = options;
      }

      var sendLog = {
        ref: 4501,
        payload: {
          operation: 'send',
          store: this.store,
          pdata: message,
          pscope: this.pscope,
          level: sevLevel,
          token: 'EkjFpCW0x',
          timestamp:dateFormat( 'mmmm dd HH:MM:ss' )
        }
      };

      socket.send( JSON.stringify( sendLog ) );

      //Console.log(); console.log transport by default
      try {
        callback( null );
      } catch ( e ) {

      }
      this.pscope = 'server';
      return Promise.resolve( 'sending of logs to server success' );
    },

    socket: socket,

    realtime: function( data ) {
      logStream( clientConnector.subscriber, store, data );
    }
  };
};

var disconnect = {
  payload: {
    operation: 'disconnect'
  }
};

process.on( 'SIGINT', () => {
  socket.send( JSON.stringify( disconnect ) );
  process.exit();
} );

module.exports = Logger;
