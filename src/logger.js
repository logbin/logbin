//Logger class in here
//Seperate logger to log-stream later
'use strict';
let clientConnector = require( './lib/clientConnector.js' );
let _ = require( 'lodash' );
let dateFormat = require( 'dateformat' );
let Q = require( 'q' );
let NodeCache = require( 'node-cache' );
let UUID = require( 'uuid-js' );
let prettyjson = require( 'prettyjson' );
let levels = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
let refDeferredPairCache = new NodeCache( { stdTTL: 5, checkperiod: 1 } );

let inbound = clientConnector.inbound;

inbound.on( 'message', ( response ) => {
  let jsonResponse = JSON.parse( response.toString() );
  resolveDeferred( jsonResponse );
} );

class Logger {

  constructor( opts ) {

    if ( !opts.token ) {
      throw new Error( 'Token field should not be empty.' );
    }

    this.store = opts.store;
    this.pscope = opts.scope || 'server';
    this.level = opts.level || 'info';
    this.token = opts.token;
    this.transports = opts.transports;
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

  setScope( scope ) {
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
      operation: 'send',
      store: this.store,
      payload: fullPayload
    };

    refDeferredPairCache.set( request.ref, deferred, this.requestTTL );

    if ( shouldLog ) {
      if ( this.transports.indexOf( 'console' ) !== -1 ) {
        console.log( JSON.stringify( request ) );
      }
      if ( this.transports.indexOf( 'tcp' ) !== -1 ) {
        request.ref = this._ack ? request.ref : null;
        inbound.send( JSON.stringify( request ) );
      }
    }

    return deferred.promise;
  }

  //Implement realtime instance here
  realtime(  opts ) {
    return instanceOfRealtime( opts );
  }

}

// Realtime Object
let EventEmitter = require( 'events' );
let outbound = clientConnector.outbound;

class RealTime extends EventEmitter {
  constructor( opts ) {
    super();

    outbound.on( 'message', ( data ) => {
      let jsonData = JSON.parse( data.toString() );

      if ( jsonData.operation === 'SEND_LOG' ) {
        this.triggerLogReceived( jsonData );
      }

      if ( jsonData.operation === 'SUBSCRIBE_ERROR' ) {
        console.log( 'Subscription failed. Please check realtime settings.' );
      }
    } );

    this.store = opts.store;
    this.filter = opts.filter;
    this.uri = opts.uri || 'tcp://127.0.0.1:5556';
    this.token = opts.token;

    if ( !opts.token ) {
      throw new Error( 'Token field should not be empty.' );
    }

    // jscs: disable
    outbound.plain_password = this.token;
    // jscs: enable
    outbound.connect( this.uri );
    this.subscribe();
  }

  setStore( store ) {
    this.store = store;
    this.subscribe();
    return this;
  }

  setFilter( filter ) {
    if ( !filter.level ) {
      filter.level = 'silly';
    }
    this.filter = filter;
    this.subscribe();
    return this;
  }

  subscribe() {

    if ( !this.store ) {
      throw new Error( 'Store field should not be empty.' );
    }

    // If no filter is defined,
    // default filter is set to
    // receive all logs
    let defaultFilter = {
      level: 'silly'
    };

    let request = {
      ref: UUID.create( 1 ).toString(),
      operation: 'subscribe',
      store: this.store,
      filter: this.filter || defaultFilter
    };

    outbound.send( JSON.stringify( request ) );
  }

  triggerLogReceived( logObject ) {
    this.emit( 'log', logObject );
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

outbound.on( 'close', () => {
  console.log( 'Realtime connection to server closed.' );
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
  outbound.close();
  process.exit();
} );

function instanceOfRealtime ( opts ) {
  return new RealTime( opts );
}

function prettyDisplay ( data ) {
  console.log( prettyjson.render( data ) + '\n---------------------------------------' );
}

module.exports = {
  logger: Logger,
  realtime: instanceOfRealtime,
  prettyDisplay
};
