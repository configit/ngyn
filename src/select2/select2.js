( function( angular ) {
  'use strict';
  /*
  * Applies the jQuery-based select2 to the selected element
  *
  * If a custom-rendering attribute is specified the default object structure is not used (id and text properties expected)
  * in favour of using the item itself. This is useful when used with input elements where full responsibility is taken for querying and formatting results.
  *
  * <input type="hidden" ngyn-select2="options" ng-model="selection" multiple custom-rendering class="span11" ></input>
  */
  angular.module( 'ngynSelect2', [] ).directive( 'ngynSelect2', ['$parse', '$interpolate', '$timeout', function( $parse, $interpolate, $timeout ) {
    return {
      require: '?ngModel',
      priority: '150', // must be higher priority than ngyn-select-key
      restrict: 'A',

      link: function link( scope, elm, attrs, ngModelController ) {
        var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
        var optionsExp = attrs.ngOptions,
            match,
            valuesFn,
            isSelect = elm.is( 'select ' ),
            originalPlaceholderText;

        if ( optionsExp ) {
          match = optionsExp.match( NG_OPTIONS_REGEXP );
          valuesFn = $parse( match[7] );
        }

        var options = {};

        if ( !isSelect ) {
          options.multiple = angular.isDefined( attrs.multiple );
        }
        else {
          options.placeholderOption = function() {
            return elm.find( 'option[value=""],option[value="?"]' );
          };

          originalPlaceholderText = options.placeholderOption().text();
        }

        var oldClass = '';
        var oldPlaceholderText = '';
        scope.$watch( function() {
          // keep class of the select2 in sync with the underlying select
          var container = elm.select2( 'container' );
          var currentClass = elm.attr( 'class' );
          var select2initialized = select2initialized || !!elm.data( 'select2' );
          if ( currentClass !== oldClass ) {
            angular.forEach( oldClass.split( ' ' ), function( c ) {
              container.removeClass( c );
            } );
            angular.forEach( currentClass.split( ' ' ), function( c ) {
              if ( c.substring( 0, 8 ) !== "select2-" ) {
                container.addClass( c );
              }
            } );
            oldClass = currentClass;
          }

          // keep placeholder text in sync if it's currently visible
          if ( isSelect ) {
            var placeholderVisible = !elm.select2( 'val' ) || elm.select2( 'val' ).length === 0;
            // if it's a multi-select and it has been initialized
            if ( attrs.multiple && select2initialized ) {
              elm.data( 'select2' ).opts.placeholder = $interpolate( originalPlaceholderText )( scope );
              // if the placeholder is currently visible, update it
              if ( placeholderVisible ) {
                elm.select2( 'container' ).find( 'input.select2-default' ).val( $interpolate( originalPlaceholderText )( scope ) );
              }
            }
            else if ( select2initialized ) {
              var currentPlaceholderText = options.placeholderOption().text();
              if ( currentPlaceholderText !== oldPlaceholderText ) {
                // update the select2 generated span which holds the placeholder text
                if ( placeholderVisible ) {
                  elm.select2( 'container' ).find( '.select2-chosen' ).text( currentPlaceholderText );
                }
              }
              oldPlaceholderText = currentPlaceholderText;
            }
          }
        } );

        var createDefaultResultParser = function() {
          var key = attrs.keyPath || 'id';
          var display = attrs.displayPath || 'text';
          var keyParser = $parse( key );
          var displayParser = $parse( display );
          return function( result ) {
            return {
              id: keyParser( result ),
              text: displayParser( result )
            };
          };
        };

        var parseResult = angular.isDefined( attrs.customRendering ) ?
          function( result ) { return result; } :
          createDefaultResultParser();

        var parseResults = function( originalValues ) {
          if ( !originalValues ) {
            return originalValues;
          }

          var values = angular.isArray( originalValues ) ? originalValues : [originalValues];

          var results = [];
          angular.forEach( values, function( r ) {
            results.push( parseResult( r ) );
          } );
          return angular.isArray( originalValues ) ? results : results[0];
        };

        function updateDisabled( disabled ) {
          elm.select2( 'enable', !disabled );
        }

        function updateRequired( required ) {
          var select2Data = elm.data( 'select2' );
          var placeholderCurrentlySelected = ( !elm.select2( 'val' ) || elm.select2( 'val' ).length === 0 );

          if ( select2Data ) {
            if ( isSelect && elm.find( 'option[value=""]' ).length ) {
              select2Data.opts.allowClear = !required;
            } else {
              select2Data.opts.allowClear = false;
            }
          }

          var container = elm.select2( 'container' );
          var isCurrentlyRequired = !container.hasClass( 'select2-allowclear' );

          if ( !placeholderCurrentlySelected ) {
            if ( isCurrentlyRequired && !required ) {
              container.addClass( 'select2-allowclear' );
            }
            else if ( !isCurrentlyRequired && required ) {
              container.removeClass( 'select2-allowclear' );
            }
          }
          else {
            container.removeClass( 'select2-allowclear' );
          }
        }

        attrs.$observe( 'required', updateRequired );
        attrs.$observe( 'disabled', updateDisabled );

        if ( !isSelect ) {

          /* Problem 3 */
          ngModelController.$parsers.push( function() {
            return elm.select2( 'data' );
          } );

          /* Problem 4 */
          ngModelController.$formatters.push( function( newval ) {
            elm.select2( 'data', parseResults( newval ) );
            return newval;
          } );

          /* Problem 2 */
          elm.on( 'change', function( e ) {
            scope.$apply( function() {
              ngModelController.$setViewValue( e.val );
            } );
          } );
        }

        angular.extend( options, scope.$eval( attrs.ngynSelect2 ) );

        if ( isSelect ) {
          /* Problem 1 */
          /*
          * watch the model and the collection to ensure select2 is kept in sync with
          * the underlying select
          */
          scope.$watch( attrs.ngModel, function() {
            elm.select2( 'val', elm.val() );
          } );

          if ( valuesFn ) {
            // watch the collection; re-evaluating its representation and state every $digest
            scope.$watch( function() { return valuesFn( scope ); }, function( collection ) {

              $timeout( function() {
                elm.select2( 'val', elm.val() );
              } );
            }, true );
          }

        }

        // running in a $timeout yields significant performance improvements
        // we do however ensure the apply phase is skipped by setting the 3rd arg to false
        // this also incidentally avoids the dom being corrupted during linking
        $timeout( function() {
          elm.select2( options );
          if ( !isSelect ) {
            elm.select2( 'data', parseResults( ngModelController.$modelValue ) );
          }
          updateDisabled( attrs.disabled );
          updateRequired( attrs.required );
        }, 0, false );
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