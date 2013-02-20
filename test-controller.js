angular.module('app', ['cs.modules']).controller('TestController', 
  function($scope, $timeout) {
    $scope.titles = [
    {id:'1981', text:'Hello World', code: 'AA34'},
    {id:'1982', text:'Hello World II', code: 'AA35'}
    ];

  //TODO: Test initial selection
  $scope.currentTitle = $scope.titles[1];
  $scope.currentTitle2 = $scope.titles[1];

  $scope.setSingle = function() {
    $scope.currentTitle = $scope.titles[0];
    $scope.currentTitle2 = $scope.titles[0];
  }
  
  $scope.setMultiple = function() {
    $scope.currentTitle = $scope.titles;
    $scope.currentTitle2 = $scope.titles;
  }

  $scope.select2inputOptions = {
    query: function(query) {
      query.callback( { results: $scope.titles } )
    }
  }
});