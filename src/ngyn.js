( function( angular ) {
  'use strict';
  
  angular.module( 'ngynFormSavingExtensions', [ 'ui.bootstrap.modal' ] );
  angular.module( 'ngynServerConnection', [] );
  angular.module( 'ngynTrackChanges', [] );
   
  angular.module( 'ngyn', ['ngynSelect2',
                           'ngynRoute', 'ngynResource',
                           'ngynTimespanPicker', 'ngynServerConnection',
                           'ngynTrackChanges',
                           'ngynFormSavingExtensions'] );

} )( window.angular );
