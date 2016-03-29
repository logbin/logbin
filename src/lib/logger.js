'use strict';

var clientConnector = require( './clientConnector.js' );
var severities = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
var dateFormat = require( 'dateformat' );
clientConnector.startConnecting();
var socket = clientConnector.socket;
var pscope;
var message;

var Logger = function( name ) {
  return {
    level: severities[ 2 ],
    time: function() {
      return new Date();
    },

    pscope: 'server',
    store: name,
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
        message = options.pdata;
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
          timestamp:dateFormat( 'mmmm dd HH:MM:ss' )
        }
      };
      socket.send( JSON.stringify( sendLog ) );
      console.log( JSON.stringify( sendLog ) );
      callback( null );
      this.pscope = 'server'; //Resets the property scope to server
      //just return a resolved promise for sending a log to socket
      return Promise.resolve( 'sending of logs to server success' );
    },

    socket: socket
  };
};

module.exports = Logger;
