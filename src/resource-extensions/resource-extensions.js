( function( angular ) {
  'use strict';

  var injectCallback = function( args, successFn, errorFn ) {
    var oldSuccessFn, oldErrorFn, newargs = [];
    // if the last 2 arguments are callbacks (success and error)
    if ( args.length >= 2 && angular.isFunction( args[args.length - 2] ) ) {
      oldSuccessFn = args[args.length - 2];
      oldErrorFn = args[args.length - 1];
    }
    //otherwise if only the last one is a callback (success)
    else if ( angular.isFunction( args[args.length - 1] ) ) {
      oldSuccessFn = args[args.length - 1];
    }

    if (args.length === 0) {
      newargs.push( {} );
    }

    // push on all arguments, up to the first callback function
    for ( var i = 0; i < args.length; i++ ) {
      var arg = args[i];
      if ( angular.isFunction( arg ) ) {
        break;
      }
      newargs.push( arg );
    }

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

  // append meta object to obj._meta, creating obj._meta if necessary
  function appendToMeta( obj, meta ) {
    obj._meta = obj._meta || {};
    angular.extend( obj._meta, meta );
  }

  var ngynResourceProvider = {$get:angular.noop};

  angular.module( 'ngynResource', ['ng', 'ngResource'] )
  .config( [ '$provide', function( $provide ) {
    $provide.provider('ngynResource', ngynResourceProvider);
    $provide.decorator( '$resource', ['$delegate', function( $delegate ) {
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
        factoryArgs[2] = angular.extend( factoryArgs[2], DEFAULT_ACTIONS, ( ngynResourceProvider.actions || {} ) );
        var actions = factoryArgs[2];
        var actionKeys = Object.keys( actions );
        var resourceResult = $delegate.apply( this, factoryArgs );

        angular.forEach( actionKeys, function( action ) {
          var oldMethod = resourceResult[action];
          resourceResult[action] = function methodOveride() {
            var previousResult = this;

            var methodargs = injectCallback.call( this, arguments,
              function success() {
                if ( ngynResourceProvider.success ) {
                  // append arguments from request before calling success callback
                  appendToMeta( arguments[0], { requestArgs: methodargs[0] } );

                  // call supplied success handler on result with arguments
                  ngynResourceProvider.success.apply(
                    ( angular.isArray( previousResult ) ? previousResult : methodResult ),
                    arguments
                  );
                }
              },
              function error() {
                //methodResult is contained in a closure at this point
                if ( ngynResourceProvider.error ) {
                  // append arguments from request before calling error callback
                  appendToMeta( arguments[0], { requestArgs: methodargs[0] } );

                  // call supplied error handler on result with arguments
                  ngynResourceProvider.error.apply(
                    ( angular.isArray( previousResult ) ? previousResult : methodResult ),
                    arguments
                  );
                }
              }
            );

            var hasBody = actions[action].method === 'POST' ||
                          actions[action].method === 'PUT' ||
                          actions[action].method === 'PATCH';

            if ( angular.isFunction( methodargs[0] ) ) {
              // inject new empty arguments to ensure globally added args are possible
              methodargs.splice( 0, 0, {} );
            }

            // non-GET "class" actions have 2 object arguments: ([parameters], postData, [success], [error])
            if ( hasBody && angular.isFunction( methodargs[1] ) ) {
              methodargs.splice( 0, 0, {} );
            }

            if ( ngynResourceProvider.modifyArgs ) {
              ngynResourceProvider.modifyArgs( methodargs[0], hasBody ? methodargs[1] : null, action );
            }

            var methodResult = oldMethod.apply( this, methodargs );

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
                methodResult.parameters = requeryargs[0];
              };
            }

            methodResult.parameters = methodargs[0];
            return methodResult;
          };
        } );
        return resourceResult;
      };
    } ] );
  } ] );

} )( window.angular );
