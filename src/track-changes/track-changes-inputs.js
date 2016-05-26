( function() {
  'use strict';

  var module = angular.module( 'ngynTrackChanges' );

  // directive for change tracking of form inputs (<input>, <select> and <textarea>).
  //
  // The inputs in the form will track if they have been changed from their
  // original value.
  //
  // The change is tracked by adding a $changed property to the ngModel behind the input
  var trackChangesDirective = function() {
    return {
      name: 'ngynTrackChanges',
      restrict: 'E',
      scope: false,
      require: ['?ngModel', '?^ngynTrackChangesForm'],
      link: function( scope, element, attrs, ctrls ) {
        var ngModel = ctrls[0];
        var form = ctrls[1];
        
        if ( !ngModel )
          return;

        ngModel.$changed = false;

        function normalize( viewValue ) {
          // Special case for checkboxes which should always consider undefined to be false
          if ( element.attr( 'type' ) === 'checkbox' ) {
            return !!viewValue;
          }

          if ( element.attr( 'type' ) === 'number' ) {
            return ( viewValue || 0 ).toString();
          }

          // An unchanged input typically has a viewValue of null and has to be compared to ''
          if ( viewValue === undefined || viewValue === null || viewValue === '' ) {
            return null;
          }

          if ( angular.isArray( viewValue ) && viewValue.length === 0 ) {
            return null;
          }

          if ( angular.isObject( viewValue ) && viewValue.id !== undefined ) {
            // by default compare objects on an id property
            return viewValue.id;
          }

          return viewValue;
        }

        function trackModelChanges( val ) {
          element.data( 'orig-value', normalize( val ) );
          return val;
        };

        function trackViewChanges( val ) {
          // we must use $viewValue here because val is unset if validation of the model fails
          var changed = element.data( 'orig-value' ) !== normalize( ngModel.$viewValue );
          
          if ( ngModel.$changed == changed ) {
            return val;
          }
          
          ngModel.$changed = changed;

          element.toggleClass( 'ngyn-input-changed', changed );
          
          if ( form && changed ) {
            form.addChangedField();
          } else if ( form ) {
            form.removeChangedField();
          }

          return val;
        }

        ngModel.$parsers.push( trackViewChanges );
        ngModel.$formatters.push( trackModelChanges );

        if ( form ) {
          form.resetCallbacks.push( function() {
            trackModelChanges( ngModel.$modelValue );
            trackViewChanges( ngModel.$modelValue );
          } );
        }
      }
    };
  };

  // attach directive to tag names
  module.directive( 'input', trackChangesDirective );
  module.directive( 'select', trackChangesDirective );
  module.directive( 'textarea', trackChangesDirective );

  module.factory( 'ngynTrackChangesFactory', trackChangesDirective );

} )();