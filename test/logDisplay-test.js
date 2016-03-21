'use strict';

var assert = require( 'assert' );
var logDisplay = require( '../src/lib/logDisplay' );

describe( 'logDisplay.getSubscriptionStrings Test: ', function() {
  var store = 'VoltronChronicles';
  var scope = 'server';
  var severity = 'silly';

  it( 'Should return error when called without store argument', function() {
    let res = logDisplay.getSubscriptionStrings();
    assert.equal( 'No store given.', res.message );
  } );

  it( 'Should return expected array when called given store, scope, and severity', function() {
    let res = logDisplay.getSubscriptionStrings( store, scope, severity );
    assert.deepEqual( [ 'VoltronChroniclesservererror',
  'VoltronChroniclesserverwarn',
  'VoltronChroniclesserverinfo',
  'VoltronChroniclesserververbose',
  'VoltronChroniclesserverdebug',
  'VoltronChroniclesserversilly'
  ], res );
  } );

  it( 'Should return array when both store and severity is given, but scope is not', function() {
    let expectedArray = [ 'VoltronChroniclesservererror',
  'VoltronChroniclesserverwarn',
  'VoltronChroniclesserverinfo',
  'VoltronChroniclesserververbose',
  'VoltronChroniclesserverdebug',
  'VoltronChroniclesserversilly',
  'VoltronChroniclesapperror',
  'VoltronChroniclesappwarn',
  'VoltronChroniclesappinfo',
  'VoltronChroniclesappverbose',
  'VoltronChroniclesappdebug',
  'VoltronChroniclesappsilly'
  ];
    let res = logDisplay.getSubscriptionStrings( store, undefined, severity );
    assert.deepEqual( expectedArray, res );
  } );
} );
