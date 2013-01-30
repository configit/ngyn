describe( 'route', function () {
  "use strict";

  beforeEach( function() {
    module( 'cs.modules' );
  } );


  it( 'should serve basic route to resourceful index', function() {
    module( function( routeProvider ) {
      routeProvider.resource( { name: 'Products' } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve basic route to resourceful index using short syntax', function() {
    module( function( routeProvider ) {
      routeProvider.resource( 'Products' );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve basic route to resourceful index with scope', function() {
    module( function( routeProvider ) {
      routeProvider.resource( { name: 'Products', scope: 'admin' } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/admin/products/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve basic route to resourceful index with path alias', function() {
    module( function( routeProvider ) {
      routeProvider.resource( { name: 'Products', path: 'p' } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/p/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve route to nested index with path alias', function() {
    module( function( routeProvider ) {
      routeProvider.resource( { name: 'Lists', path: 'l' }, function () {
        this.resource( { name: 'Items', path: 'i' } );
      } ); 
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/l/1/i/index' );
      dump($route.routes)
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Items' );
      expect( $route.current.templateUrl ).toEqual( 'client/app/lists/items/index.html' );
    } );
  } );

  it( 'should serve route to nested index with empty path alias', function() {
    module( function( routeProvider ) {
      routeProvider.resource( { name: 'Lists' }, function () {
        this.resource( { name: 'Items', path: '' } );
      } ); 
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/lists/1/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Items' );
      expect( $route.current.templateUrl ).toEqual( 'client/app/lists/items/index.html' );
    } );
  } );

  it( 'should bounce / to index', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products' } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();      
      $location.path( '/products' );
      $rootScope.$digest();
      expect( $location.path() ).toEqual( '/products/index' );
    } );
  } );

  // note that products/missing is not technically incorrect as missing will become the :id parameter.
  it( 'should not serve route to missing action', function() {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/1/missing' );
      $rootScope.$digest();
      expect( $route.current).toBeUndefined();
    } );
  } );

  it( 'should respond to a custom collection action', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products', actions: { custom: 'collection' } } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/custom' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
      expect( $route.current.action ).toEqual( 'custom' );
    } );
  } );

  it( 'should generate collection action link from api call', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products' } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend, route ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( route.link( { action: 'new' } ) ).toEqual( 'products/new' );
    } );
  } );

  it( 'should generate member action link from api call', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products' } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend  , route ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( route.link( { action: 'edit', products_id: 'my-product' } ) ).toEqual( 'products/my-product/edit' );
    } );
  } );

  it( 'should be possible to specify action as objects', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products', actions: { index: 'collection', details: 'member', add: { type: 'collection' } } } );
    } );

    inject( function ( $location, $route, $rootScope, $httpBackend, route ) {
      $httpBackend.whenGET(/.+/).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( route.link( { action: 'details', products_id: 'my-product' } ) ).toEqual( 'products/my-product/details' );
      expect( route.link( { action: 'add' } ) ).toEqual( 'products/add' );
    } );
  } );

  it( 'should be possible to specify aliases', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products', actions: { details: 'member', add: { type: 'collection', alias : 'details' } } } );
    } );

    inject( function ( $route ) {
      expect( $route.routes['/products/:products_id/details'].templateUrl ).toEqual( 'client/app/products/details.html' );
      expect( $route.routes['/products/add'].templateUrl ).toEqual( 'client/app/products/details.html' );
    } );
  } );

  it( 'should be possible to specify aliases with syntax', function () {
    module( function ( routeProvider ) {
      routeProvider.resource( { name: 'Products', actions: { details: 'member', 'add:details': 'collection' } } );
    } );

    inject( function ( $route ) {
      expect( $route.routes['/products/:products_id/details'].templateUrl ).toEqual( 'client/app/products/details.html' );
      expect( $route.routes['/products/add'].templateUrl ).toEqual( 'client/app/products/details.html' );
    } );
  } );
} );