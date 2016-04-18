var Logger = require( '../dist/index.js' );

var config = {
  uri: 'tcp://127.0.0.1:5556',
  token: 'EkjFpCW0x',
  store: 'test',
  filter: {
    level: 'info',
    fields: {
      what: 'anything'
    }
  }
};

Logger.realtime( config ).on( 'log', function( data ) {
  Logger.prettyDisplay( data );
} );
