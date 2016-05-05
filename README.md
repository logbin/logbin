# Logbin.io-client
Simple real-time logging system for your node applications.

##Installation
Using npm:

    npm install logbin

##Logger API
Logger API is used to send logs from your node applications to the server.

###Initialization
Initializing the Logger API requires configuration settings.

```javascriptl
var Logbin = require( 'logbin' );

var config = {
  store: 'storename',
  token: 'validtoken'
};

var logger = Logbin( config );
```

###Options
Logger settings comes with the following options:

| Option | Definition | Required |
|:------:| ---------- |:--------:|
| *store* | Store name wherein your logs will be stored. This name must be lowercase, cannot begin with an underscore, and cannot contain commas. | required |
| *token* | Token provided to you which will be used for authentication. | required |
| *port* | (default = 5555 ) Port used by the server inbound. | optional |
| *host* | (default = 'localhost') Hostname of the server inbound. | optional |
| *scope* | ( default: 'server' ) This will be the scope of your logs. | optional |
| *level* | ( default: 'info' ) Log severity used when level is not specified upon sending the log. | optional |
| *requestTTL* | ( default: 5 ) The standard ttl of requests in seconds when no response is received from the server. | optional |

You can also instantiate new logger instance with a set scope from any logger instance created.

```javascript
//some instance of a logger

var newLogger = logger.scope( 'global' );
```
###Method Chaining
.ack() method is chainable.

####Example:

```javascript
logger.ack().error( 'An error log.' )
```

###Transports
You can select transport used by the logger by setting

####Example:

```javascript
var Logbin = require( 'logbin' );

var config = {
  store: 'storename',
  token: 'validtoken',
  console: true
};

var logger = new Logbin( config );
```

###Promise
Sending a log with .ack() method returns a promise.

####Example:

```javascript
var co = require( 'co' );

co( function *() {
  yield [
    logger.ack().error( 'An error log.' ),                            // Send a log categorized by levels
    logger.ack().warn( 'Warning log.' ),
    logger.ack().info( { name: 'M. Saavedra', action: 'login' } ),     // You can also send an object
    logger.ack().verbose( 'Over medication is o-verbose.' ),
    logger.ack().debug( 'Log for debugging.' ),
    logger.ack().silly( 'Silly me.' ),
    logger.ack().log( 'info', 'This is an information.' );            // Or you can specify the level instead
  ];
} ).catch( error => console.log( error ) );                      // Catch reason of rejection
```

##LogStream API
LogStream API is used to receive logs from your node applications in real-time.

###Initialization
Initializing the LogStream API also requires configuration settings.

```javascript
var LogStream = require( 'logbin' ).LogStream;

var config = {
  store: 'storename',
  token: 'validtoken'
};

var logstream = new LogStream( config );
```

###Options
Configuration of the LogStream API comes with the following options:

| Option | Definition | Required |
|:------:| ---------- |:--------:|
| *store* | Store name from where the logs are received. This name must be lowercase, cannot begin with an underscore, and cannot contain commas. | required |
| *token* | Used for authentication which will be provided to you. | required |
| *port* | (default = 5555 ) Port used by the server inbound. | optional |
| *host* | (default = 'localhost') Hostname of the server inbound. | optional |
| *level* | (default = 'silly' ) Severity level of logs to be received. | optional |
| *schema* | Object that follows JSON Schema draft 4 Standard. This will define the log filter. If not provided, you will receive all logs that is in range of the set severity level. | optional |

###Log levels
You can also set the severity of logs you want to receive ( on the run ).

####Example:

```javascript
  logstream.level = 'warn'; // You will receive logs with severity levels 'error' and 'warn'.
```

###Log Filtering
You can specify a filter to receive the logs you want by setting a schema. Logbin implements [JSON Schema draft 4 standard](http://json-schema.org/) for the logstream filter schema.

####Example:

```javascript
// You can set the filter in the configuration settings
var config = {
  store: 'storename',
  token: 'validtoken',
  level: 'info',  // You will receive 'error', 'warn', and 'info',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      fname: { type: 'string', pattern: '^Christopher$' },
      age: { type: 'number', maximum: 23 }
    }
  }
};

var logstream = new LogStream( config );

// You can also set it using the setter method.
// To receive logs with levels error, warn, or info that has an id with 'number' type, fname with value 'Margie', and age <= 23.
var newSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    fname: { type: 'string', pattern: '^Margie$' },
    age: { type: 'number', maximum: 23 }
  }
};
logstream.schema = newSchema;
```

###On Log Event
You can listen to the event when a log is received from the server.

####Example:

```javascript
logstream.on( 'log', data => console.log( data ) ); // data will be in object form for easier manipulation
```
