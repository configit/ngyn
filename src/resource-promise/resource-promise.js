'use strict';

angular.module( 'ngynResourcePromise', ['ngResource'] ).config( [ '$provide', function( $provide ) {
      
  var DEFAULT_ACTIONS = {
    'get': { method:'GET' },
    'save': { method:'POST' },
    'query': { method:'GET', isArray:true },
    'remove': { method:'DELETE' },
    'delete': { method:'DELETE' }
  };
  
  $provide.decorator( '$resource', [ '$delegate', '$q', function( $delegate, $q ) {
    
    return function $resourceDecoratorFn( url, paramDefaults, actions ) {
      var resource = $delegate.apply( this, arguments );
      
      actions = angular.extend( {}, DEFAULT_ACTIONS, actions );
      
      Object.keys( actions ).forEach( function( key ) {

        var originalAction = resource[key];
        
        resource[key] = function() {
          var originalPromise, originalDefer;
          var hasBody = /^(POST|PUT|PATCH)$/i.test( actions[key].method );
          var hasDefaultPromise = true;
          
          var successCallbackIndex = typeof arguments[0] == 'object' ? 1 : 0;
          if ( hasBody ) {
            successCallbackIndex = successCallbackIndex + 1;
          }
          var failureCallbackIndex = successCallbackIndex + 1;
          
          // replace the success callback with one which resolves our promise before calling the original callback
          var originalSuccessCallback = arguments[successCallbackIndex];
          arguments[successCallbackIndex] = function( response ) {
            if ( !hasDefaultPromise ) {
              queryResponse.$promise = originalPromise;
              originalDefer.resolve( response );
              queryResponse.$resolved = true;
            }
            if ( originalSuccessCallback ) {
              originalSuccessCallback( response );
            }
          }
          
          // replace the failure callback with one which resolves our promise before calling the original callback
          var originalFailureCallback = arguments[failureCallbackIndex];
          arguments[failureCallbackIndex] = function( response ) {
            if ( !hasDefaultPromise ) {
              originalDefer.reject( response );
            }
            if ( originalFailureCallback ) {
              originalFailureCallback( response );
            }
          }
          
          var queryResponse = originalAction.apply( this, arguments );

          // do nothing for versions of angular which already attach the promise
          var hasDefaultPromise = !!queryResponse.$promise;
          
          if ( !hasDefaultPromise ) {
            originalDefer = $q.defer();
            originalPromise = queryResponse.$promise = originalDefer.promise;
          }
          
          return queryResponse;
        }
      } );
      return resource;
    }
  } ] );
} ] );