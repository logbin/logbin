// This is a dummy authentication layer.
// Tests are currently using this. Remove this
// once the server is already deployed.

'use strict';

import 'babel-polyfill';
import zmq                from 'zmq';
import { ZAP }            from 'zmq-zap';
import { PlainMechanism } from 'zmq-zap';

class Auth {
  constructor() {
    this._zap = new ZAP();
    this._zap.use( new PlainMechanism( ( data, cb ) => this._authentication( data, cb ) ) );
    this._zapSocket = zmq.socket( 'router' );

    let self = this;

    this._zapSocket.on( 'message', function() {
      self._zap.authenticate( arguments, ( err, response ) => {
        if ( err ) {
          console.log( err );
        }

        if ( response ) {
          self._zapSocket.send( response );
        }
      } );
    } );
  }

  init() {
    this._zapSocket.bindSync( 'inproc://zeromq.zap.01' );
  }

  _authentication( data, cb ) {
    if ( this._verify( data.password ) ) {
      cb( null, true );
    } else {
      cb( null, false );
    }
  }

  _verify( password ) {
    return Auth.PASSWORD_LIST.some( listedPass => password === listedPass );
  }

  static get PASSWORD_LIST() {
    return [
      'EkjFpCW0x',
      'N1ljtTRb0g'
    ];
  }
}

export default new Auth();
