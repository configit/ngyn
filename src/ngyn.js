( function ( angular ) {
  'use strict';

  angular.module( 'ngyn', ['ngynSelect2',
                           'ngynRoute', 'ngynResource',
                           'ngynTimespanPicker', 'ngynServerConnection',
                           'ngynTrackChanges', 'ngynResourcePromise',
                           'ngynFormSavingExtensions'] );

} )( window.angular );
