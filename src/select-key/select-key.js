( function( angular ) {
  'use strict';

  angular.module( 'ngynSelectKey', [] ).directive( 'select', ['$parse', function( $parse ) {
    return {
      restrict: 'E',
      priority: '100',
      require: ['?ngModel', '?select'],
      link: function( scope, elm, attrs, controllers ) {
        var ngModelController = controllers[0];
        var selectController = controllers[1];
        if ( !attrs.key || !selectController ) {
          return;
        }

        /*
        * Unfortunately the selectController doesn't expose the collection it is bound to,
        * so we have to emulate the steps it takes to get at the collection
        */
        var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;
        var optionsExp = attrs.ngOptions;
        var match = optionsExp.match( NG_OPTIONS_REGEXP );
        var valuesFn = $parse( match[7] );
        var key = attrs.key;
        var keyParser = $parse( key );
        var modelValue;

        /*
        * retrieve the related element(s) (based on key)
        * and use that in place of the supplied object
        */
        function replaceModelValue() {
          var collection = valuesFn( scope );

          var mappedVals = [];
          angular.forEach( collection, function( v ) {
            angular.forEach( angular.isArray( modelValue ) ? modelValue : [modelValue], function( v2 ) {
              if ( keyParser( v ) === keyParser( v2 ) ) {
                //console.log('mapped', v2, 'to', v, 'based on', key );
                mappedVals.push( v );
              }
            } );
          } );
          if ( mappedVals.length > 0 ) {
            ngModelController.$modelValue = angular.isArray( modelValue ) ? mappedVals : mappedVals[0];
          }
        }

        /*
        * Watch the underlying collection for changes and cause reselection
        */
        scope.$watch( function() { return valuesFn( scope ); }, function() {
          if ( angular.isDefined( modelValue ) ) {
            replaceModelValue();
          }
        }, true );

        /*
        * Push on a formatter to watch changes to the underlying model
        */
        ngModelController.$formatters.push( function( val ) {
          modelValue = val;
          replaceModelValue();
          return val;
        } );
      }
    };
  }] );

} )( window.angular );