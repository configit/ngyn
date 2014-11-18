angular.module( 'ngynServerConnection' )
  .value( 'defaultResponseInterceptors', {
    jsonNetStripper: function( hubName, methodName, args ) {
      var newArgs = [];
      angular.forEach( args, function( arg ) {
        if ( arg && arg.$values ) {
          newArgs.push( arg.$values );
        } else {
          newArgs.push( arg );
        }
      } );

      return newArgs;
    }
  } );