angular.module( 'ngyn-ui-timespan-picker', [] )
  .directive('ngynTimespanPicker', function( $compile, $timeout, $document, $window ) {
  var unitMap = [
    { key: 'day', label: 'days', value: 86400 },
    { key: 'hour', label: 'hours', value: 3600 },
    { key: 'minute', label: 'minutes', value: 60 },
    { key: 'second', label: 'seconds', value: 1 }
  ];
  
  function findOrLast( array, delegate ) {
    for ( var i = 0; i < array.length; i++ ) {
      var item = array[i];
      if ( delegate( item ) ) {
        return item;
      }
    }
    return array[array.length - 1];
  }
  
  function calculateBestUnits( valueInSeconds ) { 
    return findOrLast( unitMap, function( item ) {
      return valueInSeconds >= item.value;
    } );
  };
  
  function getUnit( unitKey ) {
    return findOrLast( unitMap, function( item ) {
      return unitKey === item.key;
    } );
  };

  return {
      restrict: 'E',
      require: 'ngModel',
      replace: true,
      scope: { 
        ngModel: '='
      },
      link: function( scope, element, attrs, ngModelController ) {
        function updateModel() {
          var form = element.find( 'ng-form' ).controller( 'form' );
          
          ngModelController.$setValidity( 'number', form.$valid );
          
          if ( form.$valid ) {
            // Only update ngModel if the form is valid (e.g. value is numeric)
            scope.ngModel = scope.value * scope.unit.value;
          }
        }
        
        function ngModelUpdated( newValue, oldValue ) {
          if ( angular.isDefined( newValue ) && angular.isUndefined( oldValue ) ) {
            // Set unit the first time the model is set
            scope.unit = attrs.units ? getUnit( attrs.units ) : calculateBestUnits( newValue );
          }
          if ( scope.unit ) {
            scope.value = newValue / scope.unit.value;
          }
        }
        
        ngModelUpdated( angular.isNumber( scope.ngModel ) ? scope.ngModel : 0 );
        
        scope.units = unitMap;
        
        scope.$watch( 'ngModel', ngModelUpdated );
        
        scope.$watch( 'unit', updateModel );
        scope.$watch( 'value', updateModel );
      },
      template: 
        '<div class="ngyn-timespan-picker">' +
          '<ng-form name="validation-form">' +
            '<input type="number" name="unitValue" class="ngyn-timespan-picker-value" ng-model="value" min="0" pattern="[0-9]*" required />' +
            '<select ng-model="unit" class="ngyn-timespan-picker-unit" ng-options="u.label for u in units"></select>' + 
          '</ng-form>' +
        '</div>'
  };
});
