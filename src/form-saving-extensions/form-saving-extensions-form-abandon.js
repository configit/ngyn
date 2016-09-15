'use strict';

angular.module( 'ngynFormSavingExtensions' ).directive( 'ngynFormAbandon', function() {
  return {
    restrict: 'A',
    require: ['^form', '^ngynFormSavingExtensions'],
    link: function( scope, elm, attrs, ctrls ) {
      var formSavingExtensions = ctrls[1];
      
      elm.bind( 'click', function( evt ) {
        scope.$apply( function() {
          formSavingExtensions.abandonChanges();
          scope.$eval( attrs.ngynFormAbandon );
        } );
        evt.preventDefault();
      } );
    }
  }
} );