describe( 'ngyn form saving extensions', function() {
  'use strict';
  
  var scope, $compile, $timeout, $httpBackend, modalInstance;
  
  beforeEach( function() {
    module( 'ngynFormSavingExtensions', 'ngynTrackChanges' );

    module( function( $provide ) {
      var defer = $.Deferred();
      modalInstance =  { open: function() { return { result: defer } } };
      modalInstance.resultDefer = defer;

      $provide.factory( '$uibModal', function() {
        return modalInstance;
      } )
    } );

    inject( function( _$rootScope_, _$compile_, _$timeout_, $location, $q ) {
      scope = _$rootScope_.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;

      $location.path( '/home' );
    } );
    
    window.confirmResponse = false;
    window.confirm = function() {
     return window.confirmResponse;
    };
  } );
  
  function compile( template ) {
    var element = $compile( template )( scope );
    scope.$apply();
    return element;
  }
  
  it( 'a form without a save-action attribute should not block navigation', inject( function( $location ) {   
    var element = compile( '<form name="testForm"><input name="testInput" id="testInput" ng-model="test"></form>' );
    element.find( '#testInput' ).sendKeys( 'test' );
    scope.$apply( function() {
      $location.path( '/new-page' );
    } );
    
    expect( $location.path() ).toBe( '/new-page' );
  } ) );
  
  it( 'should stop a user navigating away when changes have been made and not saved, if the user chooses cancel', inject( function( $location ) {   
    scope.save = angular.noop;

    var element = compile( '<form name="testForm" ngyn-form-save="save"><input name="testInput" id="testInput" ng-model="test"></form>' );
    element.find( '#testInput' ).sendKeys( 'test' );
    scope.$apply( function() {
      $location.path( '/new-page' );
    } );
    modalInstance.resultDefer.resolve( false );
    
    expect( $location.path() ).toBe( '/home' );
  } ) );
  
  it( 'should not stop a user navigating away when changes have been made and not saved, if the user chooses ok', inject( function( $location ) {
    window.confirmResponse = true;
    
    scope.save = angular.noop;
    var element = compile( '<form name="testForm" ngyn-form-save="save"><input name="testInput" id="testInput" ng-model="test"></form>' );
    element.find( '#testInput' ).sendKeys( 'test' );
    
    scope.$apply( function() {
      $location.path( '/new-page' );
    } );
    modalInstance.resultDefer.resolve( true );
    
    expect( $location.path() ).toBe( '/new-page' );
  } ) );

  it( 'should not stop a user navigating away when changes have been made and saved', inject( function( $location, $q ) {   
    scope.save = function() {
      var defer = $q.defer();
      defer.resolve( 'test' );
      return { $promise: defer.promise };
    };
    
    var element = compile( '<form name="testForm"><input name="testInput" id="testInput" ng-model="test"><button id="testSubmit" ngyn-form-save="save()"></button></form>' );
    element.find( '#testInput' ).sendKeys( 'test' );
    element.find( '#testSubmit' ).click();
    scope.$apply( function() {
      $location.path( '/new-page' );
    } );
    expect( $location.path() ).toBe( '/new-page' );
  } ) );
  
  it( 'should be possible to have 2 save actions. The last should trigger on submit', inject( function( $location, $q ) {
    window.confirmResponse = true;
    var saveCalled = false;
    scope.save2 = function() {
      saveCalled = true;
      var defer = $q.defer();
      defer.resolve( 'test' );
      return { $promise: defer.promise };
    };
    
    var element = compile( '<form name="testForm"><input name="testInput" id="testInput" ng-model="test"><button id="testSubmit" ngyn-form-save="save()"></button><button id="testSubmit2" ngyn-form-save="save2()"></button></form>' );
    
    element.find( '#testInput' ).sendKeys( 'test' );
    element.submit();
    
    expect( saveCalled ).toBe( true );
    expect( $location.path() ).toBe( '/home' );
  } ) );

  it( 'should not stop a user navigating away when changes have been made and the form has been abandoned', inject( function( $location ) {   
    scope.abandon = function() {
      $location.path( '/new-page' );
    };

    var element = compile( '<form name="testForm"><input name="testInput" id="testInput" ng-model="test"><button id="testSubmit" ngyn-form-save="save()"></button><button id="testAbandon" ngyn-form-abandon="abandon()"></button></form>' );
    element.find( '#testInput' ).sendKeys( 'test' );

    element.find( '#testAbandon' ).click();
    expect( $location.path() ).toBe( '/new-page' );
  } ) );
    
  describe( 'when combined with track changes', function() {
    it ( 'should block navigation when value changed and allow when reverted', inject( function( $location, $q ) {
      window.confirmResponse = false;
      scope.save = angular.noop;
      scope.test = 'original';
      
      var element = compile( '<form name="testForm"><input name="testInput" id="testInput" ng-model="test"><button id="testSubmit" ngyn-form-save="save()"></button></form>' );

      element.find( '#testInput' ).sendKeys( 'changed' );
      scope.$apply( function() {
        $location.path( '/new-page' );
      } );
      expect ( $location.path() ).toBe( '/home' );

      element.find( '#testInput' ).sendKeys( 'original' );
      scope.$apply( function() {
        $location.path( '/new-page' );
      } );
      expect ( $location.path() ).toBe( '/new-page' );

    } ) );
  } );
  
} );