( function ( angular ) {
  'use strict';

  var injectCallback = function (args, successFn, errorFn) {
    var oldSuccessFn, oldErrorFn, newargs = [];
    // if the last parameter is a function
    if (angular.isFunction(args[args.length-1])) {
      // and the 2nd to last is...
      if (args.length >= 2 && angular.isFunction(args[args.length-2])){
        // we have both callbacks
        oldSuccessFn = args[args.length-2]
        oldErrorFn = args[args.length-1]
      }
      if (!oldSuccessFn) {
        oldSuccessFn = args[args.length-1]
      }
    }

    angular.forEach(args, function (arg) {
      if (!angular.isFunction(arg)) {
        newargs.push(arg);
      }
    });

    newargs.push(function success () {
      if (successFn) {
        successFn.apply(this, arguments);
      }
      if (oldSuccessFn) {
        oldSuccessFn.apply(this, arguments);
      }
    });

    newargs.push(function error () {
      if (errorFn) {
        errorFn.apply(this, arguments);
      }
      if (oldErrorFn) {
        oldErrorFn.apply(this, arguments);
      }
    });

    return newargs;
  };

  angular.module('cs.modules.resource-extensions', ['ng']).config(['$provide', function($provide) {
    $provide.decorator('$resource', function ($delegate) {
      return function $resourceDecoratorFn () {
        var resourceResult = $delegate.apply(this, arguments);
        var oldQuery = resourceResult.query;
        var totalCount;

        resourceResult.query = function queryOveride() {
          var queryargs = injectCallback.call(this ,arguments,
            function success (response, headerFn) {
              var headerVal = headerFn('totalCount');
              if (headerVal) {
                response.totalCount = parseInt(headerVal);
                if (response.totalCount === NaN) {
                  response.totalCount = undefined;
                }
              } else if (angular.isArray(response)) {
                response.totalCount = response.length;
              }
            },
            function error (response) {
              // Do not have access to 'value' inside the Resource
              // to assign the results to
            }
            );

          var queryResult = oldQuery.apply( this, queryargs);

          queryResult.requery = function () {
            var requeryargs = injectCallback(arguments, function (data) {
              queryResult.length = 0;
              angular.forEach(data, function(r) {
                queryResult.push(r);
              });
            });

            resourceResult.query.apply(this, requeryargs);
          };
          return queryResult;
        };
        return resourceResult;
      }
    });
}]);    

})(window.angular);