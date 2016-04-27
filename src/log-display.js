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
    let me = this;

    co( function*() {
      let fileContent = yield me._readFile();
      me.configJson = JSON.parse( fileContent );

      assert( me.configJson.store, `'store' is not specified` );
      assert( me.configJson.token, `'token' is not specified` );

      let stream = new me._logger.LogStream( me.configJson );

      stream.on( 'log', ( data ) => {
        let color = me.colors( data[ '@level' ] );
        let output = [];
        output.push( me.prettify.render( data[ '@level' ], color ) );
        output.push( '[ ' + me.prettify.render( data[ '@scope' ], color ) + ' ]' );
        output.push( '[' + me.prettify.render( data[ '@timestamp' ], color ) + ']' );

        if ( data[ '@message' ] ) {
          output.push( ' ' + me.prettify.render( data[ '@message' ], color ) );
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
