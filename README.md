# Logbin.io-client
Simple real-time logging system for your node applications.

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
  token: 'validtoken',
  host: 'ec2-52-196-108-147.ap-northeast-1.compute.amazonaws.com'
};

var logger = new Logbin( config );
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
| *console* | ( default: false ) If set to true, logs are not sent to the server and will only show up in the console. | optional |

###Log Levels
Log levels are `error`, `warn`, `info`, `verbose`, `debug`, and `silly`.

###Send Logs
Sending logs is easy.

####Example:
```javascript
logger.error( 'Something bad happened.' );
logger.info( { id: 12345, name: 'Margie', age: 23, action: 'login' } );
logger.log( 'warn', 'The night is dark and full of terrors.' );
```

###Scoping
You can also instantiate new logger instance with a set scope from any logger instance created.

```javascript
//some instance of a logger

var globals = logger.scope( 'global' );

globals.error( 'A global error occured.' );
```
###Method Chaining
.ack() method is chainable.

####Example:

```javascript
logger.ack().error( 'An error log.' )
```

###Transports
You can select not to send your logs to the server, instead, log it directly
to your console by setting the `console` property to true.

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
  yield logger.ack().error( 'An error log.' ),                            // Send a log categorized by levels
  yield logger.ack().warn( 'Warning log.' ),
  yield logger.ack().info( { name: 'M. Saavedra', action: 'login' } ),     // You can also send an object
  yield logger.ack().verbose( 'Over medication is o-verbose.' ),
  yield logger.ack().debug( 'Log for debugging.' ),
  yield logger.ack().silly( 'Silly me.' ),
  yield logger.ack().log( 'info', 'This is an information.' );            // Or you can specify the level instead
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
  token: 'validtoken',
  host: 'ec2-52-196-108-147.ap-northeast-1.compute.amazonaws.com'
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

###Log Levels
Logbin has predefined log levels which are `error`, `warn`, `info`, `verbose`, `debug`, and `silly`. Setting the `level` field in the LogStream API config object to `info` will allow you to receive logs with levels from `info` up to `error`. Leaving it to the default value which is `silly` will allow you to receive logs with all log levels.

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
      fname: { type: 'string', pattern: '^Margie$' },
      age: { type: 'number', maximum: 23 }
    }
  }
};

var logstream = new LogStream( config );
```

###On Log Event
You can listen to the event when a log is received from the server.

####Example:

```javascript
logstream.on( 'log', data => console.log( data ) ); // data will be in object form for easier manipulation
```

### Adding custom event
You can add a custom event to be called when a specifig log arrives

#### Adding custom event when a specific log type (error/info/silly/etc) arrives
#####Example:

```javascript
logstream.addCustomEvent( { event: 'mycustomevent', level: 'error' } );
} );
```

#### Adding custom event when a specific log type (error/info/silly/etc) and data arrives
#####Example:

```javascript
// This will look into the logs sent looking for the occurence of the message
logstream.addCustomEvent( { event: 'mycustomevent', level: 'error', message: 'this is a log' } );

// Meanwhile in the logger
logger.error( 'this is a log' );
} );
```

#### Adding custom event when a specific log type (error/info/silly/etc) and custom data arrives
#####Example:

```javascript
// This will look into the logs sent looking for the occurence of the message
logstream.addCustomEvent( { event: 'mycustomevent', level: 'error', mymsg: 'this is a log' } );

// Meanwhile in the logger
logger.error( { mymsg: 'this is a log' } );
} );
```

#### Adding custom event that will look for logs for a specified interval
#####Example:

```javascript
// This will look into the logs for the specified interval (in milliseconds) and will return the logs matched after the interval.
logstream.addCustomEvent( { event: 'mycustomevent', level: 'error', interval: 5000 } );
```

#### Adding custom event that will look for logs for a specified interval and the limit of logs that should be received
#####Example:

```javascript
// This event will look into the logs for the specified interval (in milliseconds) and limit, this custom event will be triggered on the logs exceed the limit
logstream.addCustomEvent( { event: 'mycustomevent', level: 'error', interval: 5000, limit: 1 } );
```

####Options
Configuration for adding custom events

| Option | Definition | Required |
|:------:| ---------- |:--------:|
| event | the custom event name | required |
| level | the log type/level | required |
| message | the text occurence to search for in the logs sent | optional |
| interval | in milliseconds, the time until the event is triggered | optional |
| limit | the limit for the logs to be received, if limit is reached then the event is triggered. should come with interval option | optional |

###Listening for the custom events
#####Example:

```javascript
logstream.on( 'mycustomevent', ( msg, log ) => {
    console.log( msg ); // This is the message from the log stream.
    console.log( log ); // The log data
} );
```

##Server
As of now, Logbin is still in its early stages of development. As the project initiates its testing phase, we need people to use the service to discover bugs and receive feedback for improvement. Fortunately, you can already use this service by connecting to the server with the following host.

    Host: 'ec2-52-196-108-147.ap-northeast-1.compute.amazonaws.com'

Just add the hostname above in your config object to the API.
During the testing phase, there is no token validation implemented yet so you can put any string to this field.

##License
MIT
