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
        var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
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
            var value = angular.isArray( modelValue ) ? mappedVals : mappedVals[0];
	        	
	        	var modelGetter = $parse(attrs['ngModel']);
	        	var modelSetter = modelGetter.assign;
	        	modelSetter(scope, value);	  
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
