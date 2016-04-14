# Logbin.io-client
Simple real-time logging system for your node applications.

## Dependencies
* ZMQ Library

### Installation of ZMQ Library
Install necessary packages:

    sudo apt-get install libtool pkg-config build-essential autoconf automake
    sudo apt-get install libzmq-dev
    sudo apt-get install uuid uuid-dev uuid-runtime

Install `libsodium`:

    wget https://download.libsodium.org/libsodium/releases/libsodium-1.0.10.tar.gz
    tar -xvf libsodium-1.0.10.tar.gz
    cd libsodium-1.0.10/
    ./configure
    make
    sudo make install

Install `ZeroMQ Library`:

    wget http://download.zeromq.org/zeromq-4.1.4.tar.gz
    tar -xvf zeromq-4.1.4.tar.gz
    cd zeromq-4.1.4/
    ./configure
    make
    sudo make install
    sudo ldconfig

##Installation
Using npm:

    npm install logbin

##Logger API
Logger API is used to send logs from your node applications to the server.

###Initialization
Initializing the Logger API requires configuration settings.

```javascript
var Logbin = require( 'logbin' );

var config = {
  store: 'storename',
  token: 'validtoken'
};

var logger = Logbin.logger( config );
```

###Options
Logger settings comes with the following options:

| Option | Definition | Required |
|:------:| ---------- |:--------:|
| *store* | Store name wherein your logs will be stored. This name must be lowercase, cannot begin with an underscore, and cannot contain commas. | required |
| *token* | Token provided to you which will be used for authentication. | required |
| *uri* | Address of the server. When not specified, default address will be used. | optional |
| *scope* | ( default: 'server' ) This will be the scope of your logs. | optional |
| *level* | ( default: 'info' ) Log severity used when level is not specified upon sending the log. | optional |
| *requestTTL* | ( default: 5 ) The standard ttl of requests in seconds when no response is received from the server. | optional |

###Method Chaining
Each non-returning method returns the logger instance to enable chaining.

####Example:

```javascript
logger
  .setStore( 'anotherstore' )   // Set a new store value
  .setScope( 'app' )            // Set a new scope
  .setRequestTTL( 3 );          // Set the standard ttl of requests in seconds
```

###Promise
Sending a log to the server returns a promise.

####Example:

```javascript
var co = require( 'co' );

co( function *() {
  yield [
    logger.ack().error( 'An error log.' ),                            // Send a log categorized by levels
    logger.ack().warn( 'Warning log.' ),
    logger.ack().info( { name: 'Vukqiawich', action: 'login' } ),     // You can also send an object
    logger.ack().verbose( 'Over medication is o-verbose.' ),
    logger.ack().debug( 'Log for debugging.' ),
    logger.ack().silly( 'Silly me.' ),
    logger.ack().log( 'info', 'This is an information.' );            // Or you can specify the level instead
  ];
} ).catch( error => console.log( error ) );                      // Catch reason of rejection
```

##Real-time API
Real-time API is used to receive logs from your node applications in real-time.

###Initialization
Initializing the Real-time API also requires configuration settings.

```javascript
var Logbin = require( 'logbin' );

var config = {
  store: 'storename',
  token: 'validtoken'
};

var logger = Logbin.realtime( config );
```

###Options
Configuration of the realtime API comes with the following options:

| Option | Definition | Required |
|:------:| ---------- |:--------:|
| *store* | Store name from where the logs are received. This name must be lowercase, cannot begin with an underscore, and cannot contain commas. | required |
| *token* | Used for authentication which will be provided to you. | required |
| *uri* | Address of the server. When not specified, default address will be used. | optional |
| *filter* | An object that will specify the filtering of logs. If unspecified, all logs will be received. | optional |

###Log Filtering
You can specify filters to receive the logs you want.

####Example:

```javascript
// You can set the filters in the configuration settings
var config = {
  store: 'storename',
  token: 'validtoken',
  filter: {
    level: 'error',                 // The severity level of logs you want to receive
    fields: {
      '@message': 'An error log.',  // When you want to receive logs with exact matching strings
    }
  }
};

var logger = Logbin.realtime( config );

// You can also set it using a setter method.
// To receive logs with levels error, warn, or info with login action
var newFilter = {
  level: 'info',
  fields: {
    action: 'login' // You can filter against objects you sent from your applications
  }
};
logger.setFilter( newFilter );

// You can also leave the fields object blank
var filterWithNoFieldMatching = {
  level: 'info'
};
logger.setFilter( filterWithNoFieldMatching );
```

###Method Chaining
Each non-returning method returns the realtime instance to enable chaining.

####Example:

```javascript
logger
  .setStore( 'newStore' )           // Change the current store
  .setFilter( { level: 'info' } );  // Change to new filter
```

###On Log Event
You can also listen to the event when a log is received from the server.

####Example:

```javascript
logger.on( 'log', data => console.log( data ) ); // data will be in object form for easier manipulation
```
