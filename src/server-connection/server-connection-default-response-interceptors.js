'use strict';

angular.module( 'ngynServerConnection' )
  .value( 'defaultResponseInterceptors', {
    jsonNetStripper: function( hubName, methodName, response ) {
      if ( response && response.$values ) {
        return response.$values;
      }

      return response;
    }
  } );
