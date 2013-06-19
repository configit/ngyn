angular.module('app', ['ngynSelect2', 'ngynSelectKey']).controller('TestController', function($scope) {
  $scope.colors = [
    { id:'1', name:'Red', hex: '#FF0000'},
    { id:'2', name:'Green', hex: '#00FF00'},
    { id:'3', name:'Blue', hex: '#0000FF'}
  ];

  $scope.colorPickers = [];
  $scope.colorPickers[5] = $scope.colors[1];
  $scope.colorPickers[7] = $scope.colors[2];
  $scope.asyncColors = [];
  $scope.asyncPicker = undefined;


  // select2 relies on having a property named text, so we add it onto our 
  // colors collection in preparation
  angular.forEach($scope.colors, function(color) {
    color.text = color.name;
  });


  $scope.setPickerToGreen = function(index) {
    $scope.colorPickers[index] = $scope.colors[1];
  }
  
  $scope.setPickerToRedAndBlue = function(index) {
    $scope.colorPickers[index] = [$scope.colors[0], $scope.colors[2]];
  }

  $scope.clear = function(index) {
    $scope.colorPickers[index] = null;
  }

  $scope.select2inputOptions = {
    // simulate getting some data back from the server
    query: function(query) {
      window.setTimeout(function() {
        query.callback( { results: $scope.colors } )
      }, 500);
    }
  }
  
  
  window.setTimeout(function() {
    $scope.$apply(function() {
      angular.copy($scope.colors, $scope.asyncColors);
      $scope.colorPickers[6] = $scope.colors[0];
    });
  }, 1000);

});