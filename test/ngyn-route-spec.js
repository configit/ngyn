describe( 'route', function() {
  "use strict";

  beforeEach( function() {
    module( 'ngyn.route' );
  } );


  it( 'should serve basic route to resourceful index', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );


  it( 'should serve basic route to resourceful index using short syntax', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( 'Products' );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve basic route to resourceful index with path', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products', path: 'admin' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/admin/products/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve basic route to resourceful index with url alias', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products', urlAlias: 'p' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/p/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
    } );
  } );

  it( 'should serve route to nested index with path alias', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Lists', urlAlias: 'l' }, function() {
        this.resource( { name: 'Items', urlAlias: 'i' } );
      } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/l/1/i/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Items' );
      expect( $route.current.templateUrl ).toEqual( 'client/app/lists/items/index.html' );
    } );
  } );

  it( 'should serve route to nested index with empty path alias', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Lists' }, function() {
        this.resource( { name: 'Items', urlAlias: '' } );
      } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/lists/1/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Items' );
      expect( $route.current.templateUrl ).toEqual( 'client/app/lists/items/index.html' );
    } );
  } );

  it( 'should bounce / to index', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products' );
      $rootScope.$digest();
      expect( $location.path() ).toEqual( '/products/index' );
    } );
  } );

  // note that products/missing is not technically incorrect as missing will become the :id parameter.
  it( 'should not serve route to missing action', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/1/missing' );
      $rootScope.$digest();
      expect( $route.current ).toBeUndefined();
    } );
  } );

  it( 'should respond to a custom collection action', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products', actions: { custom: 'collection' } } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/custom' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Products' );
      expect( $route.current.action ).toEqual( 'custom' );
    } );
  } );

  it( 'should generate collection action link from api call', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( ngynRoute.link( { action: 'new' } ) ).toEqual( 'products/new' );
    } );
  } );

  it( 'should generate member action link from api call', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( ngynRoute.link( { action: 'edit', products_id: 'my-product' } ) ).toEqual( 'products/my-product/edit' );
    } );
  } );

  it( 'should observe appRoot', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.appRoot = 'store';
      ngynRouteProvider.resource( { name: 'Products' } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( $route.current.templateUrl ).toEqual( 'store/products/index.html' );
    } );
  } );

  it( 'should be possible to specify action as objects', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products', actions: { index: 'collection', details: 'member', add: { type: 'collection' } } } );
    } );

    inject( function( $location, $route, $rootScope, $httpBackend, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/products/index' );
      $rootScope.$digest();
      expect( ngynRoute.link( { action: 'details', products_id: 'my-product' } ) ).toEqual( 'products/my-product/details' );
      expect( ngynRoute.link( { action: 'add' } ) ).toEqual( 'products/add' );
    } );
  } );

  it( 'should be possible to specify aliases', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products', actions: { details: 'member', add: { type: 'collection', alias: 'details' } } } );
    } );

    inject( function( $route ) {
      expect( $route.routes['/products/:products_id/details'].templateUrl ).toEqual( 'client/app/products/details.html' );
      expect( $route.routes['/products/add'].templateUrl ).toEqual( 'client/app/products/details.html' );
    } );
  } );

  it( 'should be possible to specify aliases with syntax', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Products', actions: { details: 'member', 'add:details': 'collection' } } );
    } );

    inject( function( $route ) {
      expect( $route.routes['/products/:products_id/details'].templateUrl ).toEqual( 'client/app/products/details.html' );
      expect( $route.routes['/products/add'].templateUrl ).toEqual( 'client/app/products/details.html' );
    } );
  } );

  it( 'should generate a link for an action', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Theatres' } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/theatres/index' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Theatres' );
      expect( $route.current.action ).toEqual( 'index' );
      expect( ngynRoute.link( { action: 'details', theatres_id: 1 } ) ).toMatch( 'theatres/1/details' );
    } );
  } );

  it( 'should generate a link for an action when not on a resourceful route', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Theatres' } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      expect( ngynRoute.link( { controller: 'Theatres', action: 'details', theatres_id: 1 } ) ).toMatch( 'theatres/1/details' );
    } );
  } );

  it( 'should generate a link for an action in a nested resource', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Theatres' }, function() {
        this.resource( { name: 'Screens' } );
      } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/theatres/1/screens/' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Screens' );
      expect( $route.current.action ).toEqual( 'index' );
      expect( ngynRoute.link(
        { action: 'details', theatres_id: 1, screens_id: 3 } )
      ).toMatch( 'theatres/1/screens/3/details' );
    } );
  } );

  it( 'should generate a link for an action in a nested resource with ambiguous choices', function() {
    module( function( ngynRouteProvider ) {
      ngynRouteProvider.resource( { name: 'Theatres' }, function() {
        this.resource( { name: 'Screens' } );
      } );
      ngynRouteProvider.resource( { name: 'DemoTheatres' }, function() {
        this.resource( { name: 'Screens' } );
      } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/theatres/1/screens/' );
      $rootScope.$digest();
      expect( $route.current.name ).toEqual( 'Screens' );
      expect( $route.current.action ).toEqual( 'index' );
      expect( ngynRoute.link(
          { action: 'details', theatres_id: 1, screens_id: 3 }
        ) ).toMatch( 'theatres/1/screens/3/details' );
    } );
  } );

  it( 'should route to complex nested controller/action path', function() {
    module( function( $routeProvider, ngynRouteProvider ) {
      $routeProvider.when( '/', { template: 'test' } );
      ngynRouteProvider.resource( { name: 'Theatres' }, function() {
        this.resource( { name: 'Screens' } );
      } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/' );
      $rootScope.$digest();
      expect( ngynRoute.link(
        { controller: 'theatres/screens', action: 'details', theatres_id: 1, screens_id: 3 } )
      ).toMatch( 'theatres/1/screens/3/details' );
    } );
  } );

  it( 'should route to complex nested controller/action path with concise syntax', function() {
    module( function( $routeProvider, ngynRouteProvider ) {
      $routeProvider.when( '/', { template: 'test' } );
      ngynRouteProvider.resource( { name: 'Theatres' }, function() {
        this.resource( { name: 'Screens' } );
      } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/' );
      $rootScope.$digest();
      expect(
        ngynRoute.link( 'theatres/screens#details', { theatres_id: 1, screens_id: 3 } )
      ).toMatch( 'theatres/1/screens/3/details' );
    } );
  } );

  it( 'should route to controller#action with concise syntax', function() {
    module( function( $routeProvider, ngynRouteProvider ) {
      $routeProvider.when( '/', { template: 'test' } );
      ngynRouteProvider.resource( { name: 'Theatres' } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/' );
      $rootScope.$digest();
      expect(
        ngynRoute.link( 'theatres#new' )
      ).toMatch( 'theatres/new' );
    } );
  } );

  it( 'should go to defualt controller action when called with concise syntax', function() {
    module( function( $routeProvider, ngynRouteProvider ) {
      $routeProvider.when( '/', { template: 'test' } );
      ngynRouteProvider.resource( { name: 'Theatres' } );
    } );

    inject( function( $route, $httpBackend, $location, $rootScope, ngynRoute ) {
      $httpBackend.whenGET( /.+/ ).respond();
      $location.path( '/' );
      $rootScope.$digest();
      ngynRoute.gotoLink( 'theatres' );
      $rootScope.$digest();
      expect( $location.path() ).toMatch( 'theatres/index' );
    } );
  } );

} );