angular.module('app', ['ngynSelect2', 'ngynSelectKey']).controller('TestController', function($scope) {
  $scope.colors = [
    { id:'1', name:'Red', hex: '#FF0000'},
    { id:'2', name:'Green', hex: '#00FF00'},
    { id:'3', name:'Blue', hex: '#0000FF'}
  ];

  $scope.names = [
    { first: 'Luciano', last: 'Pavarotti' },
    { first: 'Placido', last: 'Domingo' },
    { first: 'Jose', last: 'Carrera' }
  ];

  $scope.colorPickers = [];
  $scope.colorPickers[5] = $scope.colors[1];
  $scope.colorPickers[7] = $scope.colors[2];
  $scope.asyncColors = [];
  $scope.asyncPicker = undefined;

  $scope.namePickers = [];

  $scope.languagePickers = [];

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
  
  $scope.setPickerToPavarottiAndCarrera = function(index) {
    $scope.namePickers[index] = [$scope.names[0], $scope.names[2]];
  }
  $scope.clear = function(index) {
    $scope.colorPickers[index] = null;
  }

  $scope.clearNames = function(index) {
    $scope.namePickers[index] = null;
  }

  $scope.select2inputOptions = {
    // simulate getting some data back from the server
    query: function(query) {
      window.setTimeout(function() {
        query.callback( { results: $scope.colors } )
      }, 500);
    }
  }

  $scope.select2CustomInputOptions = {
    // simulate getting some data back from the server
    query: function( options ) {
      options.callback( {
        results: $scope.names,
        more: false
      } );
    },
    formatSelection: function( name ) {
      return name.first + ' ' + name.last;
    },
    formatResult: function( name, container, query ) {
      return name.first + ' ' + name.last;
    },
    id: function( name ) {
      return name.first + name.last;
    }
  }

  $scope.isInput7Valid = function() {
    return $('#input7').controller('form').input7.$valid;
  }
    
  window.setTimeout(function() {
    $scope.$apply(function() {
      angular.copy($scope.colors, $scope.asyncColors);
      $scope.colorPickers[6] = $scope.colors[0];
    });
  }, 1000);

});