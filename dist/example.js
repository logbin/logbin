'use strict';

var Logger = require('./index.js');
var co = require('co');

var config = { 
  uri: 'tcp://127.0.0.1:5556', 
  token: 'EkjFpCW0x', 
  store: 'test', 
  filter: { 
    level: 'info' } };


var opts = { 
  store: 'test', 
  token: 'EkjFpCW0x', 
  transports: ['console', 'tcp'] };



var myLogger = Logger.logger(opts);

Logger.realtime(config).on('log', function (data) {
  console.log(data);});



setInterval(function () {
  myLogger.log('error', { name: 'Jefferson D. Miralles', what: 'anything' });}, 
1000);


// myLogger.realtime( { level: 2, fields: {
//   fname: 'Christopher'
// } } );