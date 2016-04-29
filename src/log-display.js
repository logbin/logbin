'use strict';

import Logger       from './logger';
import prettyJson   from 'prettyjson';
import fs           from 'fs-promise';
import 'babel-polyfill';
import co           from 'co';
import assert       from 'assert';

export default class LogDisplay {
  constructor( configFile ) {
    this.configFile = configFile;
    this.prettify = prettyJson;
    this._logger = Logger;
  }

  _readFile() {
    let fileExt = 'json';

    return fs.readFile( './' + this.configFile + '.' + fileExt, 'utf-8' );
  }

  show() {
    let self = this;

    co( function*() {
      let fileContent = yield self._readFile();
      self.configJson = JSON.parse( fileContent );

      assert( self.configJson.store, `'store' is not specified` );
      assert( self.configJson.token, `'token' is not specified` );

      let stream = new self._logger.LogStream( self.configJson );

      stream.on( 'log', ( data ) => {
        let color = self.colors( data[ '@level' ] );
        let output = [];
        output.push( self.prettify.render( data[ '@level' ], color ) );
        output.push( '[ ' + self.prettify.render( data[ '@scope' ], color ) + ' ]' );
        output.push( '[' + self.prettify.render( data[ '@timestamp' ], color ) + ']' );

        if ( data[ '@message' ] ) {
          output.push( ' ' + self.prettify.render( data[ '@message' ], color ) );
        }

        let payloadKeys = Object.keys( data );
        let payload = [];

        payloadKeys.forEach( function( val ) {
          payload.push( val + ': ' + data[ val ] );
        } );

        output.push( ' { ' + payload.join( ', ' ) + ' }' );

        console.log( output.join( '' ) );
      } );
    } );
  }

  colors( level ) {
    let colors = {
      error: {
        keysColor: 'white',
        stringColor: 'red'
      },
      warn: {
        keysColor: 'white',
        stringColor: 'magenta'
      },
      info: {
        keysColor: 'white',
        stringColor: 'green'
      },
      verbose: {
        noColor: true
      },
      debug: {
        keysColor: 'white',
        stringColor: 'red'
      },
      silly: {
        noColor: true
      }
    };

    if ( level ) {
      return colors[ level ];
    }

    return colors;
  }

}
