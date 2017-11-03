'use strict';

angular.module( 'ngynServerConnection' )
  .value( 'defaultResponseInterceptors', {
    jsonNetStripper: function( hubName, methodName, response ) {
      if ( response.$values ) {
        return response.$values;
      }

      return response;
    }
  } );
