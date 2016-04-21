'use strict';

var Logbin = require( '../index' );
var config = {
  store: 'test',
  token: 'EkjFpCW0x',
  level: 'info',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      fname: { type: 'string', pattern: '^Christopher$' },
      age: { type: 'number', maximum: 25 }
    }
  }
};

var logstream = new Logbin.LogStream( config );

logstream.on( 'log', data => console.log( data ) );
