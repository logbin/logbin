'use strict';
require('babel-polyfill');
require('co-mocha');

var assert = require('assert');
var zmq = require('zmq');
var Q = require('q');

var uri = 'tcp://127.0.0.1:5556';

// Start dummy outbound server
var router = zmq.socket('router');

// jscs: disable
router.plain_server = 1;
// jscs: enable
router.bind(uri);

var clientIdentity;
router.on('message', function (envelope, data) {
  clientIdentity = envelope;
  var jsonRequest = JSON.parse(data.toString());
  var response = { 
    ref: jsonRequest.ref, 
    operation: 'SUBSCRIBE_ACK' };

  router.send([envelope, JSON.stringify(response)]);});


describe('Testing Realtime Logstream API', function () {
  var config = { 
    uri: uri, 
    token: 'EkjFpCW0x', 
    store: 'test', 
    filter: { 
      level: 'error' } };



  var realtime = require('../dist/index.js').realtime(config);

  it('should support chaining of non-returning methods', function () {
    var newFilter = { 
      level: 'info', 
      fields: { 
        name: 'Christopher', 
        age: 23 } };


    realtime.
    setStore('testing').
    setFilter(newFilter);

    assert.equal(realtime.store, 'testing');
    assert.equal(JSON.stringify(realtime.filter), JSON.stringify(newFilter));});


  // For testing purposes, we send a log from dummy server
  // to client. The promise returned should be resolved
  // on realtime.on( 'log' ) event.
  // In this test, we do not consider the functionality
  // of filters yet. It is only to test whether
  // the eventemitter fires on log event when the server
  // sends a log to the client
  var deferred = Q.defer();
  it('should trigger the realtime.on log event', regeneratorRuntime.mark(function _callee() {var 
    anyLog, 









    result;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:anyLog = { operation: 'SEND_LOG', payload: { '@message': 'Just a usual log.', '@pscope': 'server', '@level': 'silly', '@timestamp': 'April 11 16:33:30' } };_context.next = 3;return routerSendToClient(anyLog);case 3:result = _context.sent;
            assert.equal(result.operation, 'SEND_LOG');case 5:case 'end':return _context.stop();}}}, _callee, this);}));


  function routerSendToClient(data) {

    // The clientIdentity here should already
    // be set after we have called on the
    // subscribe method
    router.send([clientIdentity, JSON.stringify(data)]);
    return deferred.promise;}


  realtime.on('log', function (logObject) {
    deferred.resolve(logObject);});});