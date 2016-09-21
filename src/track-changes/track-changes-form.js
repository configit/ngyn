'use strict';

angular.module( 'ngynTrackChanges' ).directive( 'form', function() {
  return {
    name: 'ngynTrackChangesForm',
    restrict: 'E',
    scope: false,
    require: ['form', 'ngynTrackChangesForm'],
    controller: [ '$element', function( $element ) {
      var ctrl = this;
      ctrl.resetCallbacks = [];
      
      var changedFields = 0;
      
      function updateStatus() {
        // if the value changes to 1 or 0 this indicates a change in state (going from unchanged, to changed and vice versa)
        if ( changedFields < 2 ) {
          ctrl.form.$changed = changedFields > 0;
          $element.toggleClass( 'ngyn-form-changed', ctrl.form.$changed );
        }
      }
      
      this.addChangedField = function() {
        changedFields++;
        updateStatus();
      }
      
      this.removeChangedField = function() {
        changedFields--;
        updateStatus();
      }

      this.removeAllChangedFields = function() {
        changedFields = 0;
        ctrl.resetCallbacks.forEach( function( cb ) {
          cb();
        } );
        updateStatus();
      }
    } ],
    link: function( scope, elm, attrs, ctrls ) {
      var form = ctrls[0];
      var ctrl = ctrls[1];
      
      ctrl.form = form;
    }    
  }
} );