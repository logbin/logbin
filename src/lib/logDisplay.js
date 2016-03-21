'use strict';

function getSubscriptionStrings ( store, scope, severity ) {
  if ( !store ) {
    return new Error( 'No store given.' );
  }

  severity = severity !== undefined ? severity : '';
  severity = severity === '--pretty' ? '' : severity;
  severity = severity === '--all' ? '' : severity;

  scope = scope !== undefined ? scope : '';
  scope = scope === '--pretty' ? '' : scope;
  scope = scope === '--all' ? '' : scope;

  let subscriptionStrings = [];
  let scopeItems = [ 'server', 'app' ];
  let severities = [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ];
  let filteredSeverities = severities.filter( sev => {
    return ( severities.indexOf( severity ) >= severities.indexOf( sev ) );
  } );

  if ( scope === '' && severity ) {
    scopeItems.forEach( ( item ) => {
      filteredSeverities.forEach( ( sev ) => {
        subscriptionStrings.push( store + item + sev );
      } );
    } );
    return subscriptionStrings;
  }

  filteredSeverities.forEach( ( sev ) => {
    subscriptionStrings.push( store + scope + sev );
  } );
  return subscriptionStrings;
}

module.exports = {
  getSubscriptionStrings: getSubscriptionStrings
};
