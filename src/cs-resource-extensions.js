( function( angular ) {
  'use strict';

  var injectCallback = function( args, successFn, errorFn ) {
    var oldSuccessFn, oldErrorFn, newargs = [];
    // if the last parameter is a function
    if ( angular.isFunction( args[args.length - 1] ) ) {
      // and the 2nd to last is...
      if ( args.length >= 2 && angular.isFunction( args[args.length - 2] ) ) {
        // we have both callbacks
        oldSuccessFn = args[args.length - 2];
        oldErrorFn = args[args.length - 1];
      }
      if ( !oldSuccessFn ) {
        oldSuccessFn = args[args.length - 1];
      }
    }

    angular.forEach( args, function( arg ) {
      if ( !angular.isFunction( arg ) ) {
        newargs.push( arg );
      }
    } );

    newargs.push( function success() {
      if ( successFn ) {
        successFn.apply( this, arguments );
      }
      if ( oldSuccessFn ) {
        oldSuccessFn.apply( this, arguments );
      }
    } );

    newargs.push( function error() {
      if ( errorFn ) {
        errorFn.apply( this, arguments );
      }
      if ( oldErrorFn ) {
        oldErrorFn.apply( this, arguments );
      }
    } );

    return newargs;
  };

  var config = {};

  angular.module( 'cs.modules.resource', ['ng', 'ngResource'] )
  .config( ['$provide', function( $provide ) {
    $provide.decorator( '$resource', function( $delegate ) {
      return function $resourceDecoratorFn() {

        var DEFAULT_ACTIONS = {
          'get': { method: 'GET' },
          'save': { method: 'POST' },
          'query': { method: 'GET', isArray: true },
          'remove': { method: 'DELETE' },
          'delete': { method: 'DELETE' }
        };
        
        var factoryArgs = [];
        for ( var i = 0; i < 3; i++ ) {
          factoryArgs.push( arguments[i] || {} );
        }
        factoryArgs[2] = angular.extend( factoryArgs[2], DEFAULT_ACTIONS, ( config.actions || {} ) );
        var actions = factoryArgs[2];
        var actionKeys = Object.keys( actions );

        var resourceResult = $delegate.apply( this, factoryArgs );

        angular.forEach( actionKeys, function( action ) {
          var oldMethod = resourceResult[action];
          resourceResult[action] = function methodOveride() {
            var previousResult = this;

            var methodargs = injectCallback.call( this, arguments,
              function success() {
                if ( config.success ) {
                  config.success.apply(
                    (angular.isArray(previousResult) ? previousResult : methodResult),
                    arguments
                  );
                }
              },
              function error() {
                //methodResult is contained in a closure at this point
                if ( config.error ) {
                  config.error.apply(
                    ( angular.isArray( previousResult ) ? previousResult : methodResult ),
                    arguments
                  );
                }
              }
            );

            var hasBody = actions[action].method == 'POST' || actions[action].method == 'PUT' || actions[action].method == 'PATCH';

            if ( angular.isFunction( methodargs[0] ) ) {
              // inject new empty arguments to ensure globally added args are possible
              methodargs.splice( 0, 0, {} );
            }
            
            // non-GET "class" actions have 2 object arguments: ([parameters], postData, [success], [error])
            if (hasBody && angular.isFunction(methodargs[1])) {
              methodargs.splice( 0, 0, {} );
            }

            if ( config.modifyArgs ) {
              config.modifyArgs( methodargs[0], action );
            }

            var methodResult = oldMethod.apply( this, methodargs );
            methodResult.parameters = methodargs[0];

            if ( action === 'query' ) {
              methodResult.requery = function() {
                var requeryargs = injectCallback( arguments, function( data ) {
                  methodResult.length = 0;
                  angular.forEach( data, function( r ) {
                    methodResult.push( r );
                  } );
                } );

                requeryargs[0] = angular.extend( {}, methodargs[0], requeryargs[0] );
                methodargs[0] = requeryargs[0];

                resourceResult.query.apply( methodResult, requeryargs );
              };
            };
            return methodResult;
          };
        } );
        return resourceResult;
      };
    } );
  }] )
  .run( ['cs.modules.config', function( moduleConfig ) {
    config = moduleConfig.resource || {};
  }] );

} )( window.angular );