'use strict';

var clientConnector = require( './lib/clientConnector.js' );
var dateFormat = require( 'dateformat' );

// Suspend logstream functionality for now
// var logStream = require( './lib/logStream.js' );
var Q = require( 'q' );
var NodeCache = require( 'node-cache' );
var UUID = require( 'uuid-js' );

var refDeferredPairCache = new NodeCache( { stdTTL: 5, checkperiod: 1 } );
var severities = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
var socket = clientConnector.socket;
var pscope;
var message;

var Logger = function( opts ) {
  var store = opts.store;
  clientConnector.startConnecting( opts.uri );
  clientConnector.connectToOutbound();

  clientConnector.sendConnectionRequest();
  clientConnector.startHeartBeat();

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

    log: function( sevLevel, options ) {
      let deferred = Q.defer();

      if ( !options ) {
        deferred.reject( 'Invalid arguments' );
      }

      if ( typeof options !== 'string' ) {
        this.pscope = options.scope !== undefined ? options.scope : 'server';
        message = options;
      } else {
        pscope = ( options.scope !== undefined ) ? options.scope : 'server';
        message = options;
      }

      var sendLog = {
        ref: UUID.create( 1 ).toString(),
        operation: 'send',
        store: this.store,
        payload: {
          pdata: message,
          pscope: this.pscope,
          level: sevLevel,
          timestamp: dateFormat( 'mmmm dd HH:MM:ss' )
        }
      };

      socket.send( JSON.stringify( sendLog ) );
      refDeferredPairCache.set( sendLog.ref, deferred );
      this.pscope = 'server';

      return deferred.promise;
    },

    socket: socket

    // *** Reconstruct later
    // realtime: function( data ) {
    //   logStream( clientConnector.subscriber, store, data );
    // }
  };
};

socket.on( 'message', ( response ) => {
  let jsonResponse = JSON.parse( response.toString() );
  var deferred = refDeferredPairCache.get( jsonResponse.ref );
  if ( deferred ) {
    refDeferredPairCache.del( jsonResponse.ref );
    deferred.resolve( jsonResponse );
  }
} );

refDeferredPairCache.on( 'expired', ( ref, deferred ) => {
  deferred.reject( 'No response received for message with reference id: ' + ref );
} );

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
