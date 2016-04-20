//Logger class in here
//Seperate logger to log-stream later
'use strict';
let clientConnector = require( './lib/clientConnector.js' );
let assert = require( 'assert' );
let _ = require( 'lodash' );
let dateFormat = require( 'dateformat' );
let Q = require( 'q' );
let NodeCache = require( 'node-cache' );
let UUID = require( 'uuid-js' );
let levels = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
let refDeferredPairCache = new NodeCache( { stdTTL: 5, checkperiod: 1 } );

let inbound = clientConnector.inbound;

inbound.on( 'message', ( response ) => {
  let jsonResponse = JSON.parse( response.toString() );
  resolveDeferred( jsonResponse );
} );

class Logger {

  constructor( opts ) {

    if ( !opts.console ) {
      assert( opts.store, `'store' is not specified` );
      assert( opts.token, `'token' is not specified` );
    }

    this.store = opts.store;
    this.pscope = opts.scope || 'server';
    this.level = opts.level || 'info';
    this.token = opts.token;
    this.console = opts.console || false;
    this.requestTTL = opts.requestTTL || 5;

    // jscs: disable
    inbound.plain_password = this.token;
    // jscs: enable
    inbound.connect( opts.uri || 'tcp://127.0.0.1:5555' );

    _( levels ).forEach( ( level ) => {
      Logger.prototype[ level ] = function( input ) {
        return this.log( level, input );
      };
    } );

  }

  setStore( store ) {
    this.store = store;
    return this;
  }

  scope( scope ) {
    this.scope = scope;
    return this;
  }

  setLevel( level ) {
    this.level = level;
    return this;
  }

  setRequestTTL( sec ) {
    this.requestTTL = sec;
    return this;
  }

  ack() {
    this._ack = true;
    return this;
  }

  log( ...params ) {
    let shouldLog = true;
    let level = this.level;
    let input;
    let deferred = Q.defer();

    switch ( params.length ) {
      case 0: {
        let error = {
          code: 'EMISSINGARG',
          message: 'Missing log arguments'
        };

        deferred.reject( error );
        break;
      }

      case 1: {
        input = params[ 0 ];
        break;
      }

      case 2: {

        if ( levels.indexOf( params[ 0 ] ) !== -1 ) {
          level = params[ 0 ];
          input = params[ 1 ];
        } else {
          let error = {
            code: 'ELEVELINVALID',
            message: 'Invalid level: ' + level,
            input: input,
            validLevels: levels
          };
          deferred.reject( error );

          // Prevents the client side from crashing the server
          shouldLog = false;
        }
        break;
      }
      default:
    }

    let partialPayload = {
      '@pscope': this.pscope,
      '@level': level,
      '@timestamp': dateFormat( 'mmmm dd HH:MM:ss' )
    };

    let fullPayload;
    if ( typeof( input ) === 'string' ) {
      partialPayload[ '@message' ] = input;
      fullPayload = partialPayload;
    } else if ( typeof( input ) === 'object' ) {
      fullPayload = _.merge( partialPayload, input );
    }

    let request = {
      ref: UUID.create( 1 ).toString(),
      operation: 'SEND',
      store: this.store,
      payload: fullPayload
    };

    refDeferredPairCache.set( request.ref, deferred, this.requestTTL );

    if ( shouldLog ) {
      if ( this.console ) {
        console.log( JSON.stringify( request ) );
      }
      if ( !this.console ) {
        request.ref = this._ack ? request.ref : null;
        inbound.send( JSON.stringify( request ) );
      }
    }

    return deferred.promise;
  }

}

function resolveDeferred ( jsonResponse ) {
  let deferred = refDeferredPairCache.get( jsonResponse.ref );
  let ack = jsonResponse.operation === 'SEND_ACK' || jsonResponse.operation === 'SUBSCRIBE_ACK';

  if ( deferred && ack ) {
    deferred.resolve( jsonResponse );
  }

  if ( deferred && !ack ) {
    deferred.reject( jsonResponse );
  }

  refDeferredPairCache.del( jsonResponse.ref );
}

// Monitor on close server connection events
inbound.on( 'close', () => {
  console.log( 'Logger connection to server closed.' );
  inbound.close();
} );

// Handle 'on expire' events of node-cache elements
refDeferredPairCache.on( 'expired', ( ref, deferred ) => {
  let error = {
    code: 'ENORESPONSE',
    message: 'No response from server.'
  };
  deferred.reject( error );
} );

process.on( 'SIGINT', () => {
  inbound.close();
  process.exit();
} );

module.exports = {
  logger: Logger
};
