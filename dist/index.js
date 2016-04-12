'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;};var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}

var password = 'EkjFpCW0x';

var clientConnector = require('./lib/clientConnector.js');
var _ = require('lodash');
var dateFormat = require('dateformat');
var Q = require('q');
var NodeCache = require('node-cache');
var UUID = require('uuid-js');
var prettyjson = require('prettyjson');
var levels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
var refDeferredPairCache = new NodeCache({ stdTTL: 5, checkperiod: 1 });

var inbound = clientConnector.inbound;

inbound.on('message', function (response) {
  var jsonResponse = JSON.parse(response.toString());
  resolveDeferred(jsonResponse);});var 


Logger = function () {

  function Logger(opts) {_classCallCheck(this, Logger);

    this.store = opts.store;
    this.pscope = opts.scope || 'server';
    this.level = opts.level || 'info';
    this.token = opts.token || password;
    this.transports = opts.transports;
    this.requestTTL = opts.requestTTL || 5;

    // jscs: disable
    if (!opts.noPassword) {
      inbound.plain_password = this.token;}

    // jscs: enable
    inbound.connect(opts.uri || 'tcp://127.0.0.1:5555');

    _(levels).forEach(function (level) {
      Logger.prototype[level] = function (input) {
        return this.log(level, input);};});}_createClass(Logger, [{ key: 'setStore', value: function setStore(





    store) {
      this.store = store;
      return this;} }, { key: 'setScope', value: function setScope(


    scope) {
      this.scope = scope;
      return this;} }, { key: 'setLevel', value: function setLevel(


    level) {
      this.level = level;
      return this;} }, { key: 'setRequestTTL', value: function setRequestTTL(


    sec) {
      this.requestTTL = sec;
      return this;} }, { key: 'log', value: function log() 


    {
      var shouldLog = true;
      var level = this.level;
      var input = void 0;
      var deferred = Q.defer();

      switch (arguments.length) {
        case 0:{
            var error = { 
              code: 'EMISSINGARG', 
              message: 'Missing log arguments' };


            deferred.reject(error);
            break;}


        case 1:{
            input = arguments.length <= 0 ? undefined : arguments[0];
            break;}


        case 2:{

            if (levels.indexOf(arguments.length <= 0 ? undefined : arguments[0]) !== -1) {
              level = arguments.length <= 0 ? undefined : arguments[0];
              input = arguments.length <= 1 ? undefined : arguments[1];} else 
            {
              var _error = { 
                code: 'ELEVELINVALID', 
                message: 'Invalid level: ' + level, 
                input: input, 
                validLevels: levels };

              deferred.reject(_error);

              // Prevents the client side from crashing the server
              shouldLog = false;}

            break;}

        default:}


      var partialPayload = { 
        '@pscope': this.pscope, 
        '@level': level, 
        '@timestamp': dateFormat('mmmm dd HH:MM:ss') };


      var fullPayload = void 0;
      if (typeof input === 'string') {
        partialPayload['@message'] = input;
        fullPayload = partialPayload;} else 
      if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') {
        fullPayload = _.merge(partialPayload, input);}


      var request = { 
        ref: UUID.create(1).toString(), 
        operation: 'send', 
        store: this.store, 
        payload: fullPayload };


      refDeferredPairCache.set(request.ref, deferred, this.requestTTL);

      if (shouldLog) {
        if (this.transports.indexOf('console') !== -1) {
          console.log(JSON.stringify(request));}

        if (this.transports.indexOf('tcp') !== -1) {
          inbound.send(JSON.stringify(request));}}



      return deferred.promise;}


    //Implement realtime instance here
  }, { key: 'realtime', value: function realtime(opts) {
      return instanceOfRealtime(opts);} }]);return Logger;}();




// Realtime Object
var EventEmitter = require('events');
var outbound = clientConnector.outbound;var 

RealTime = function (_EventEmitter) {_inherits(RealTime, _EventEmitter);
  function RealTime(opts) {_classCallCheck(this, RealTime);var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(RealTime).call(this));


    outbound.on('message', function (data) {
      var jsonData = JSON.parse(data.toString());
      if (jsonData.operation === 'SEND_LOG') {
        _this.triggerLogReceived(jsonData);} else 
      {
        resolveDeferred(jsonData);}});



    _this.store = opts.store;
    _this.filter = opts.filter;
    _this.uri = opts.uri || 'tcp://127.0.0.1:5556';
    _this.token = opts.token || password;

    // jscs: disable
    if (!opts.noPassword) {
      outbound.plain_password = _this.token;}

    // jscs: enable
    outbound.connect(_this.uri);
    _this.subscribe();return _this;}_createClass(RealTime, [{ key: 'setStore', value: function setStore(


    store) {
      this.store = store;
      return this;} }, { key: 'setFilter', value: function setFilter(


    filter) {
      this.filter = filter;
      return this;} }, { key: 'subscribe', value: function subscribe() 


    {

      if (!this.store) {
        throw new Error('Store field should not be empty.');}


      // If no filter is defined,
      // default filter is set to
      // receive all logs
      var defaultFilter = { 
        level: 'silly' };


      var request = { 
        ref: UUID.create(1).toString(), 
        operation: 'subscribe', 
        store: this.store, 
        filter: this.filter || defaultFilter };


      var deferred = Q.defer();
      refDeferredPairCache.set(request.ref, deferred);

      outbound.send(JSON.stringify(request));
      return deferred.promise;} }, { key: 'triggerLogReceived', value: function triggerLogReceived(


    logObject) {
      this.emit('log', logObject);} }]);return RealTime;}(EventEmitter);



function resolveDeferred(jsonResponse) {
  var deferred = refDeferredPairCache.get(jsonResponse.ref);
  if (deferred) {
    deferred.resolve(jsonResponse);
    refDeferredPairCache.del(jsonResponse.ref);}}



// Handle 'on expire' events of node-cache elements
refDeferredPairCache.on('expired', function (ref, deferred) {
  var error = { 
    code: 'ENORESPONSE', 
    message: 'No response from server.' };

  deferred.reject(error);});


process.on('SIGINT', function () {
  process.exit();});


function instanceOfLogger(opts) {
  return new Logger(opts);}


function instanceOfRealtime(opts) {
  return new RealTime(opts);}


function prettyDisplay(data) {
  console.log(prettyjson.render(data) + '\n---------------------------------------');}


module.exports = { 
  logger: instanceOfLogger, 
  realtime: instanceOfRealtime, 
  prettyDisplay: prettyDisplay };