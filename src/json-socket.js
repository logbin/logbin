'use strict';

var SEP = '\0';

function isJson ( data ) {
  return !( data instanceof Buffer );
}

function onData ( socket, data ) {
  if ( !( data instanceof Buffer ) ) {

    // JsonEvent bound on 'data', exit the inception
    return;
  }
  socket.jsonInbuf = ( socket.jsonInbuf || '' ) + data.toString();
  try {
    while ( socket.jsonInbuf.length ) {
      data = socket.jsonInbuf;
      var sep = data.indexOf( SEP );
      if ( sep > 0 ) {
        var len = parseInt( data.slice( 0, sep ) );
        data = data.slice( sep + 1, sep + len + 1 );
        if ( data.length !== len ) {

          // Not enough data
          return;
        }
        socket.jsonInbuf = socket.jsonInbuf.slice( sep + len + 1 );
        let jsonData = JSON.parse( data );
        socket.emit( socket.jsonEvent, jsonData );
        socket.emit( jsonData.operation, jsonData );
        continue;
      } else if ( sep < 0 && data.length < 10 ) {

        // Sep not found, not enough data
        // 1e10 characters seems overly reasonable
        return;
      }

      return;
    }
  } catch ( e ) {
    socket.emit( 'error', e );
  }
}

function decorateSocket ( socket, jsonEvent ) {
  if ( socket.isJsonSocket ) {
    return socket;
  }
  socket.on( 'data', onData.bind( null, socket ) );

  socket.jsonEvent = jsonEvent || 'data';

  var write = socket.write;
  socket.write = function() {
    var args = [].slice.call( arguments );
    var data = JSON.stringify( args[ 0 ] );
    var msg = data.length + SEP + data;
    args[ 0 ] = msg;
    write.apply( socket, args );
  };
  socket.isJsonSocket = true;
  return socket;
}

decorateSocket.isJson = isJson;
module.exports = decorateSocket;
