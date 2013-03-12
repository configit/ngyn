( function( angular ) {

  angular.module( 'cs.modules' )
  /*
  * Applies the jQuery-based select2 to the selected element 
  */
  .directive( 'csSelect2', ['$parse', '$timeout', function( $parse, $timeout ) {
    return {
      require: '?ngModel',
      priority: '150', // must be higher priority than cs-key
      restrict: 'A',

      compile: function( originalElement ) {
        var placeholderText,
            placeholderOption = originalElement.find( 'option[value=""]' );

        if ( placeholderOption.length > 0 ) {
          placeholderText = placeholderOption.text();
          placeholderOption.text( '' );
        }

        return function link( scope, elm, attrs, ngModelController ) {
          var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/
          var optionsExp = attrs.ngOptions,
              match,
              valuesFn;
          if ( optionsExp ) {
            match = optionsExp.match( NG_OPTIONS_REGEXP );
            valuesFn = $parse( match[7] );
          }

          var key = attrs.keyPath || 'id';
          var display = attrs.displayPath || 'text';
          var keyParser = $parse( key );
          var displayParser = $parse( display );

          var parseResult = function( originalvalues ) {
            if ( !originalvalues ) {
              return originalvalues;
            }

            var values = angular.isArray( originalvalues ) ? originalvalues : [originalvalues];

            var results = [];
            angular.forEach( values, function( r ) {
              results.push( {
                id: keyParser( r ),
                text: displayParser( r )
              } );
            } );
            return angular.isArray( originalvalues ) ? results : results[0];
          };

          if ( !elm.is( 'select' ) ) {

            /* Problem 3 */
            ngModelController.$parsers.push( function() {
              return elm.select2( 'data' );
            } );
            /* Problem 4 */
            ngModelController.$formatters.push( function( newval ) {
              elm.select2( 'data', parseResult( newval ) );
              return newval;
            } );

            /* Problem 2 */
            elm.on( 'change', function( e ) {
              scope.$apply( function() {
                ngModelController.$setViewValue( e.val );
              } );
            } );
          }

          // initialize the select2
          var options = {};

          if ( placeholderText ) {
            options.placeholder = placeholderText;
          }

          if ( elm.is( 'input' ) ) {
            options.multiple = angular.isDefined( attrs.multiple );
          }

          angular.extend( options, scope.$eval( attrs.csSelect2 ) );

          /* Problem 1 */
          /*
          * watch the model and the collection to ensure select2 is kept in sync with
          * the underlying select
          */

          if ( elm.is( 'select' ) ) {
            scope.$watch( attrs.ngModel, function() {
              elm.select2( 'val', elm.val() );
            } );

            if ( valuesFn ) {
              // watch the collection; re-evaluating it's reresentation and state every $digest
              scope.$watch( function() { return valuesFn( scope ); }, function() {
                elm.select2( 'val', elm.val() );
              } );
            }

          }
          
          // running in a $timeout yields significant performance improvements
          // we do however ensure the apply phase is skipped by setting the 3rd arg to false
          // this also incidentally avoids the dom being corrupted during linking
          $timeout( function() {
            elm.select2( options );
            if ( !elm.is( 'select' ) ) {
              elm.select2( 'data', parseResult( ngModelController.$modelValue ) );
            }
          }, 0, false );
        };
      }
    };
  }] );

} )( window.angular );

/* Problem descriptions */
/*
SELECT BASED
P1: When updating ng-model, select2 doesn't reflect the new value
S1a: Use a formatter to call elm.select2('val', elm.val()); (error prone and doesn't deal with collection changing)
S1b: every time we $digest, ensure the values are synced.

INPUT BASED
P2: When selecting an item manually, the value does not trigger an ng-model update
S2: Watch elm.change and trigger $setViewValue(elm.val())

P3: When selecting an item manually, the value is just an id
S3: Use a $parser to return elm.select2('data'), which is the value the control was initialized with

P4: When updating ng-model, select2 doesn't reflect the new value
S4: Use a formatter to call elm.select2('data', newModelValue);
    The id is plucked from data for use in val, but we need the full data for retrieval
    as it can't be mapped to an option as it is in a select

*/