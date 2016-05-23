'use strict';

import assert       from 'assert';
import net          from 'net';
import _            from 'lodash';
import EventEmitter from 'events';
import uuid         from 'node-uuid';
import jsonEnable   from './json-socket';

export default class LogStream extends EventEmitter {
  constructor( opts ) {
    super();

    assert( opts.store, `'store' is not specified` );
    assert( opts.token, `'token' is not specified` );
    assert( /(?!^_|^-)^[a-z0-9_-]+$/.test( opts.store ), `'store' invalid format` );

    this._opts = _.defaults( opts, {
      port: 5556,
      host: 'localhost',
      level: 'silly',
      levels: LogStream.DEFAULT_LOG_LEVELS,
      schema: {}
    } );

    this._LOG_DATA = {};
    this._LOG_MSG = {
      noLogs: 'No logs received',
      hasLogs: 'Logs received',
      tooManyLogs: 'Logs received exceeds the limit'
    };
    this._propSocket = this._socket;
  }

  _subscribe() {
    let request = {
      ref: uuid.v1(),
      operation: 'SUBSCRIBE',
      level: this._opts.level,
      schema: this._opts.schema
    };
    this._propSocket.write( request );
  }

  set _socket( socket ) {
    this._propSocket = socket;
  }

  get _socket() {
    if ( !this._propSocket ) {
      let socket = net.connect( {
        port: this._opts.port || 5556,
        host: this._opts.host || 'localhost'
      } );

      jsonEnable( socket, 'json' );

      socket.on( 'json', data => {
        if ( data.operation === 'SEND_LOG' ) {
          this.emit( 'log', data.payload );
        }

        if ( data.operation === 'CONN_ACK' ) {
          this._authorized = true;
          this._subscribe();
        }

        if ( data.operation === 'CONN_FAIL' ) {
          console.log( `Connection failed. ${ data.error }` );
        }

        if ( data.operation === 'INVALID_OPERATION' ) {
          console.log( `${ data.error }` );
        }
      } );

      socket.on( 'error', ( err ) => {
        console.log( `Logger socket has encountered a problem: ${ err }` );
      } );

      socket.on( 'close', () => {
        console.log( `Socket has been closed.` );
      } );

      socket.write( {
        ref: uuid.v1(),
        operation: 'CONNECT',
        store: this._opts.store,
        token: this._opts.token
      } );

      this._propSocket = socket;
    }
    return this._propSocket;
  }

  _createInterval( opts ) {
    let self = this;

    setTimeout( function() {
      let log = '';
      let msg = self._LOG_MSG;

      if ( self._LOG_DATA.hasOwnProperty( opts.event ) ) {
        if ( self._LOG_DATA[ opts.event ].hasOwnProperty( opts.level ) ) {
          log = self._LOG_DATA[ opts.event ][ opts.level ];

          delete self._LOG_DATA[ opts.event ][ opts.level ];
        }
      }

      if ( opts.hasOwnProperty( 'limit' ) ) {
        if ( log.length > opts.limit ) {
          self.emit( opts.event, log, msg.tooManyLogs );

          return;
        } else {
          return;
        }
      }

      self.emit( opts.event, log, ( log ? msg.hasLogs : msg.noLogs ) );
    }, opts.interval );
  }

  addCustomEvent( opts ) {
    let self = this;
    let keys = [ 'level', 'message', 'event', 'interval', 'limit' ];

    assert( opts.event, `'event' is not specified` );
    assert( opts.level, `'level' is not specified` );

    if ( opts.hasOwnProperty( 'interval' ) ) {
      assert( /[0-9]/.test( opts.interval ), `'interval' should only be a number` );
      self._createInterval( opts );
    }

    if ( opts.hasOwnProperty( 'limit' ) ) {
      assert( /[0-9]/.test( opts.limit ), `'limit' should only be a number` );
    }

    self.on( 'log', ( data ) => {
      let listen = false,
        listenLevel = false,
        listenMsg = false,
        listenOther = false;

      // Listen to the log level the user want
      if ( data[ '@level' ] == opts.level ) {
        listenLevel = true;
      }

      // If the user want to filter the content
      if ( opts.hasOwnProperty( 'message' ) ) {

        // Log data has message
        if ( data.hasOwnProperty( '@message' ) ) {

          // Find the occurence of the searched message in the log data
          if ( data[ '@message' ].indexOf( opts.message ) >= 0 ) {
            listenMsg = true;
          }
        }
      } else {
        /**
          * Since the user does not want to filter message
          * then just allow to listen
          */
        listenMsg = true;
      }

      let otherKeys = _.difference( Object.keys( opts ), keys );
      if ( otherKeys.length > 0 ) {
        otherKeys.forEach( function( val ) {

          // Log data has this key
          if ( data.hasOwnProperty( val ) ) {

            // The data searched for is in the log
            if ( data[ val ].indexOf( opts[ val ] ) >= 0 ) {
              listenOther = true;
            }
          }
        } );
      } else {
        listenOther = true;
      }

      listen = ( listenLevel && listenMsg && listenOther ) ? true : false;

      // Setup the event emitter
      if ( listen ) {
        if ( opts.hasOwnProperty( 'interval' ) ) {
          if ( !self._LOG_DATA.hasOwnProperty( opts.event ) ) {
            self._LOG_DATA[ opts.event ] = {};
            self._LOG_DATA[ opts.event ][ opts.level ] = [];
          }

          self._LOG_DATA[ opts.event ][ opts.level ].push( data );
        } else {
          self.emit( opts.event, data, self._LOG_MSG.hasLogs );
        }
      }
    } );
  }

  static get DEFAULT_LOG_LEVELS() {
    return [
      'error',
      'warn',
      'info',
      'verbose',
      'debug',
      'silly'
    ];
  }
}
