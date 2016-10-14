'use strict';

angular.module( 'ngynFormSavingExtensions' ).directive( 'ngynFormSave', function() {
  return {
    restrict: 'A',
    require: ['^form', '^ngynFormSavingExtensions'],
    link: function( scope, elm, attrs, ctrls ) {
      var formSavingExtensions = ctrls[1];

      var isForm = elm[0].tagName.toLowerCase() === 'form';

      formSavingExtensions.setSaveAction( attrs.ngynFormSave, isForm );

      if ( !isForm ) {
        elm.bind( 'click', function( evt ) {
          scope.$apply( function() {
            // Because Internet Explorer only respects 'disabled' for clicking
            // on the actual element, event propogation continues and 
            // the save action is called even if the element is disabled. We
            // check for the existence of the disabled attribute to stop the
            // action from executing if the element is disabled.
            if ( !attrs.disabled ) {
              formSavingExtensions.save( attrs.ngynFormSave, scope );
            }
          } );
          evt.preventDefault();
        } );
      }
    }
  }
} );
