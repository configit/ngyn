angular.module('app', ['ngynRoute'])
.config(function(ngynRouteProvider,$provide) {
  var httpContent = {
    'client/app/users/index.html': 
      '<h1>Index</h1><a ng-href="{{ngynRoute.action(\'new\')}}">new</a>'
  }

  $provide.provider('$httpBackend', function() {
    this.$get = function($timeout, $rootScope, $browser){
      return function(method, url, post, callback, headers, timeout, withCredentials) {
        $timeout(function() {
          callback(200, httpContent[url]);
        });
      }
    }
  })

  ngynRouteProvider.resource('Users');
})
.controller('TestController', function($scope, $route, $http, ngynRoute) {
  $scope.ngynRoute = ngynRoute;
  console.log($route.routes);
});