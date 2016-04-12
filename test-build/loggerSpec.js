'use strict';
require('babel-polyfill');
require('co-mocha');

var assert = require('assert');
var zmq = require('zmq');

// Start a dummy inbound server
var router = zmq.socket('router');
var uri = 'tcp://127.0.0.1:5555';
router.bind(uri);

router.on('message', function (envelope, data) {
  var request = JSON.parse(data.toString());
  var response = { 
    ref: request.ref, 
    operation: 'SEND_ACK' };


  // For test purposes, do not send a response with this condition
  if (request.payload['@message'] !== 'Do not send a response.') {
    router.send([envelope, JSON.stringify(response)]);}});



describe('Testing Logger API', function () {
  var loggerConfig = { 
    noPassword: true, 
    uri: uri, 
    transports: ['tcp'], 
    store: 'clint', 
    scope: 'server', 
    requestTTL: 5000 };


  var logger = require('../dist/index.js').logger(loggerConfig);

  it('should support chaining for non-returning methods', function () {
    logger.
    setStore('teststore').
    setScope('app').
    setRequestTTL(1);

    assert.equal(logger.store, 'teststore');
    assert.equal(logger.scope, 'app');
    assert.equal(logger.requestTTL, 1);});


  it('should send an error and return a promise', regeneratorRuntime.mark(function _callee() {var 
    result;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return logger.error('I am sending an error.');case 2:result = _context.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context.stop();}}}, _callee, this);}));


  it('should send a warn and return a promise', regeneratorRuntime.mark(function _callee2() {var 
    result;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return logger.warn('I am sending a warn.');case 2:result = _context2.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context2.stop();}}}, _callee2, this);}));


  it('should send an info and return a promise', regeneratorRuntime.mark(function _callee3() {var 
    result;return regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:_context3.next = 2;return logger.info('I am sending a log.');case 2:result = _context3.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context3.stop();}}}, _callee3, this);}));


  it('should send a verbose and return a promise', regeneratorRuntime.mark(function _callee4() {var 
    result;return regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:_context4.next = 2;return logger.verbose('I am sending a verbose.');case 2:result = _context4.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context4.stop();}}}, _callee4, this);}));


  it('should send a debug and return a promise', regeneratorRuntime.mark(function _callee5() {var 
    result;return regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:_context5.next = 2;return logger.debug('I am sending a debug.');case 2:result = _context5.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context5.stop();}}}, _callee5, this);}));


  it('should send a silly and return a promise', regeneratorRuntime.mark(function _callee6() {var 
    result;return regeneratorRuntime.wrap(function _callee6$(_context6) {while (1) {switch (_context6.prev = _context6.next) {case 0:_context6.next = 2;return logger.silly('I am sending a silly.');case 2:result = _context6.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context6.stop();}}}, _callee6, this);}));


  it('should send a log with object data', regeneratorRuntime.mark(function _callee7() {var 
    result;return regeneratorRuntime.wrap(function _callee7$(_context7) {while (1) {switch (_context7.prev = _context7.next) {case 0:_context7.next = 2;return logger.log('error', { name: 'Clint', age: '23' });case 2:result = _context7.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context7.stop();}}}, _callee7, this);}));


  it('should send a log with single parameter passed', regeneratorRuntime.mark(function _callee8() {var 
    result;return regeneratorRuntime.wrap(function _callee8$(_context8) {while (1) {switch (_context8.prev = _context8.next) {case 0:_context8.next = 2;return logger.log('This is just a single argument');case 2:result = _context8.sent;
            assert.equal(result.operation, 'SEND_ACK');case 4:case 'end':return _context8.stop();}}}, _callee8, this);}));


  it('should return a server response failed', regeneratorRuntime.mark(function _callee9() {return regeneratorRuntime.wrap(function _callee9$(_context9) {while (1) {switch (_context9.prev = _context9.next) {case 0:
            this.timeout(7000);return _context9.abrupt('return', 
            logger.info('Do not send a response.').then(function fulfilled(result) {
              throw new Error('Promise unexpectedly fulfilled. Result: ' + result);}, 
            function rejected(error) {
              assert.equal(error.code, 'ENORESPONSE');}));case 2:case 'end':return _context9.stop();}}}, _callee9, this);}));



  it('should return invalid level input', regeneratorRuntime.mark(function _callee10() {return regeneratorRuntime.wrap(function _callee10$(_context10) {while (1) {switch (_context10.prev = _context10.next) {case 0:return _context10.abrupt('return', 
            logger.log('nolevellikethis', 'This is a test, obviously.').then(function fulfilled(result) {
              throw new Error('Promise unexpectedly fulfilled. Result: ' + result);}, 
            function rejected(error) {
              assert.equal(error.code, 'ELEVELINVALID');}));case 1:case 'end':return _context10.stop();}}}, _callee10, this);}));



  it('should return missing log argument', regeneratorRuntime.mark(function _callee11() {return regeneratorRuntime.wrap(function _callee11$(_context11) {while (1) {switch (_context11.prev = _context11.next) {case 0:return _context11.abrupt('return', 
            logger.log().then(function fulfilled(result) {
              throw new Error('Promise unexpectedly fulfilled. Result: ' + result);}, 
            function rejected(error) {
              assert.equal(error.code, 'EMISSINGARG');}));case 1:case 'end':return _context11.stop();}}}, _callee11, this);}));});