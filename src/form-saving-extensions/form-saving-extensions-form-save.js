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
        elm.bind( 'click', function( e )  {
          scope.$apply( function() {
            formSavingExtensions.save( attrs.ngynFormSave, scope );
          } );
          e.preventDefault();
        } );
      }
    }
  }
} );