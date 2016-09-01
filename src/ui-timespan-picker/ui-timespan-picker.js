( function( angular ) {
  'use strict';

  angular.module( 'ngynTimespanPicker', [] )
    .directive( 'ngynTimespanPicker', function() {
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
      }

      function getUnit( unitKey ) {
        return findOrLast( unitMap, function( item ) {
          return unitKey === item.key;
        } );
      }

      return {
        restrict: 'E',
        require: '^ngModel',
        priority: 100,
        replace: true,
        scope: {},
        compile: function( tElement, tAttrs ) {
          return function( scope, element, attrs, ngModelController ) {
            var formController = element.find( 'ng-form' ).controller( 'form' );

            function updateModel( newValue, oldValue ) {
              if ( newValue === oldValue ) {
                // When the watch is first set up then newValue = oldValue and
                // we do not want to run until the change
                return;
              }

              ngModelController.$setValidity( 'number', formController.$valid );

              if ( formController.$valid ) {
                // Only update ngModel if the form is valid (e.g. value is numeric)
                var seconds = scope.value * scope.unit.value;
                ngModelController.$setViewValue( seconds );
              }
            }

            function ensureIsNumeric( value ) {
              return angular.isNumber( value ) ? value : 0;
            }

            function render() {
              if ( angular.isUndefined( ngModelController.$viewValue ) ) {
                // When undefined, do not set the model as the value may not have been bound yet
                return;
              }

              scope.unit = attrs.units ? getUnit( attrs.units ) : calculateBestUnits( ngModelController.$viewValue );
              scope.value = ngModelController.$viewValue / scope.unit.value;
            }

            ngModelController.$formatters.push( ensureIsNumeric );
            ngModelController.$render = render;

            scope.units = unitMap;

            scope.$watch( 'unit', updateModel );
            scope.$watch( 'value', updateModel );
          };
        },
        template:
          '<div class="ngyn-timespan-picker">' +
            '<ng-form name="validation-form">' +
              '<input type="number" name="unitValue" class="ngyn-timespan-picker-value" ng-model="value" min="0" required />' +
              '<select ng-model="unit" class="ngyn-timespan-picker-unit" ng-options="u.label for u in units"></select>' +
            '</ng-form>' +
          '</div>'
      };
    } );
} )( window.angular );
