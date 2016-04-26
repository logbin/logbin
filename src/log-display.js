'use strict';

import Logger 		from './logger';
import prettyJson   from 'prettyjson';
import assert       from 'assert';
import co 			from 'co';
import fs			from 'fs-promise';

export default class LogDisplay {
	constructor ( configFile ) {
		assert( configFile, `'config file' is not specified` );
	}



	show () {
		let me = this;

		/*co( function* () {
			let config = yield fs.readFile('./logbin-config.json', 'utf-8');
			let log = new Logger(JSON.parse(config));
			let stream = new Logger.LogStream(JSON.parse(config));

			// let config = { token: "EkjFpCW0x", store: "abcd" };
			// let log = new Logger(config);
			// let stream = new Logger.LogStream(config);

			stream.on( 'log', (data) => {
				console.log(data);
			});

			log.info('test info');
		} );*/

		function showLogs ( data ) {
			let config = JSON.parse( data );
			let log = new Logger( config );
			let stream = new Logger.LogStream( config );

			stream.on( 'log', (data) => {
				let color = me.colors( data[ '@level' ] );
				let output = prettyJson.render( data[ '@level' ], color );
				output += '[ ' + prettyJson.render( data[ '@scope' ], color ) + ' ]';

				if( data['@message'] ) {
					output += ' ' + prettyJson.render( data[ '@message' ], color ) + ' ';
				}
				
				console.log(output);
			});

			log.info('test info');
		}

		fs.readFile( './logbin-config.json', 'utf-8' ).then( showLogs );
	}

	colors ( level ) {
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

	    return colors[ level ];
  	}

}