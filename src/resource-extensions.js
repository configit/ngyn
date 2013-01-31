( function ( angular ) {
  'use strict';

  var injectCallback = function (args, callbackFn) {
    var oldCallback;
    var newargs = [];

    angular.forEach(args, function (arg) {
      if (angular.isFunction(arg)) {
        oldCallback = arg;
      } else {
        newargs.push(arg);
      }
    });
    // push on callback
    newargs.push(function() {
      callbackFn.apply(this, arguments);
      if (oldCallback) {
        oldCallback.apply(this, arguments);
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
          var queryargs = injectCallback(arguments, function (response, headerFn) {
            var headerVal = headerFn('totalCount');
            if (headerVal) {
              response.totalCount = parseInt(headerVal);
              if (response.totalCount === NaN) {
                response.totalCount = undefined;
              }
            } else if (angular.isArray(response)) {
              response.totalCount = response.length;
            }
          });

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