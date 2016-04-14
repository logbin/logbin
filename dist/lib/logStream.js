'use strict';
var _ = require('lodash');
var prettyjson = require('prettyjson');

var connectionRequest = { 
  payload: { 
    operation: 'connect', 
    store: '', 
    token: 'EkjFpCW0x', 
    filter: { 
      level: 2, 
      fields: {} } } };





module.exports = function (subscriber, store, data) {
  var scope = data.scope;
  delete data.scope;
  var newData = _.forEach(connectionRequest, function (item) {
    item.filter = data;
    item.store = store;});


  subscriber.send(JSON.stringify(newData));
  console.log(JSON.stringify(newData));
  subscriber.on('message', function (data) {
    console.log(prettyjson.render(JSON.parse(data.toString())));});};