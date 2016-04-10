'use strict';

const password = 'EkjFpCW0x';

var clientConnector = require( './lib/clientConnector.js' );
var _ = require( 'lodash' );
var dateFormat = require( 'dateformat' );
var Q = require( 'q' );
var NodeCache = require( 'node-cache' );
var UUID = require( 'uuid-js' );
var levels = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
var refDeferredPairCache = new NodeCache( { stdTTL: 5, checkperiod: 1 } );

var inbound = clientConnector.inbound;

inbound.on( 'message', ( response ) => {
  let jsonResponse = JSON.parse( response.toString() );
  var deferred = refDeferredPairCache.get( jsonResponse.ref );
  if ( deferred ) {
    deferred.resolve( jsonResponse );
    refDeferredPairCache.del( jsonResponse.ref );
  }
} );

class Logger {

  constructor( opts ) {

    // jscs: disable
    if ( opts.password ) {
       inbound.plain_password = password;
    }
    // jscs: enable
    inbound.connect( opts.uri || 'tcp://127.0.0.1:5555' );
    this.store = opts.store;
    this.pscope = opts.scope || 'server';
    this.requestTTL = opts.requestTTL || 5;

    _( levels ).forEach( ( level ) => {
      Logger.prototype[ level ] = function( input ) {
        return this.log( level, input );
      };
    } );

    refDeferredPairCache.on( 'expired', ( ref, deferred ) => {
      let error = {
        code: 'ENORESPONSE',
        message: 'No response from server.'
      };
      deferred.reject( error );
    } );

    process.on( 'SIGINT', () => {
      process.exit();
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

  setRequestTTL( sec ) {
    this.requestTTL = sec;
    return this;
  }

  log( level, input ) {
    var deferred = Q.defer();

    if ( !input ) {
      let error = {
        code: 'EMISSINGARG',
        message: 'Missing log arguments'
      };

      deferred.reject( error );
    }

    if ( levels.indexOf( level ) === -1 ) {
      let error = {
        code: 'ELEVELINVALID',
        message: 'Invalid level: ' + level,
        input: input,
        validLevels: levels
      };
      deferred.reject( error );

      input = level;
      level = 'info';

    }

    let partialPayload = {
      '@pscope': this.scope,
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
    inbound.send( JSON.stringify( request ) );

    return deferred.promise;

  }

//Handle 'on expire' events of node-cache elements
}

function instanceOfLogger ( opts ) {
  return new Logger( opts );
}

module.exports = instanceOfLogger;
