describe( 'ngyn resource extensions', function() {
  "use strict";

  beforeEach( function() {
    module( 'ngynResource' );

    module( function( ngynResourceProvider ) {
      ngynResourceProvider.modifyArgs = function( args ) {
        args.addedArg = 'success';
      };
      ngynResourceProvider.actions = {
        'query': { method: 'GET', isArray: true },
        'update': { method: 'PUT' }
      };
      ngynResourceProvider.success = function( response ) {
        response.addedData = 'success';
        this.totalCount = response.length;
        response.totalCount = response.length;
        this._meta = response._meta;
      };
      ngynResourceProvider.error = function( response ) {
        response.error = 'error';
        this.error = 'error';
        this._meta = response._meta;
      };
    } );

  } );

  it( 'should be able to requery a resource', inject( function( $resource, $httpBackend ) {
    $httpBackend.whenGET( /surname=flintstone/ ).respond( '[{"name": "fred"}]' );
    $httpBackend.whenGET( /surname=rubble/ ).respond( '[{"name": "barney"}]' );

    var User = $resource( 'api/users/:userid' );

    var users = User.query( { surname: 'flintstone' } );
    $httpBackend.flush();
    expect( users[0].name ).toEqual( 'fred' );

    users.requery( { surname: 'rubble' } );
    $httpBackend.flush();
    expect( users[0].name ).toEqual( 'barney' );
  } ) );

  // this is $resource included behavior but it tested here as the extensions could interfere with it
  it( 'should return mocked header when using resource', inject( function( $resource, $httpBackend ) {
    $httpBackend.whenGET( /api\/users/ ).respond( 200, [{ name: "fred" }], { 'x-myheader': "header-value" } );
    var header;

    var User = $resource( 'api/users/:userid' );
    User.query( function( data, headerFn ) {
      header = headerFn( 'x-myheader' );
    } );

    $httpBackend.flush();
    expect( header ).toBe( 'header-value' );
  } ) );

  it( 'should maintain success callback when supplied alone', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond( '[{"name": "fred"}]' );
    var User = $resource( 'api/users/:userid' );
    var cbResponse;
    User.query( function success( response ) {
      cbResponse = response;
    } );
    $httpBackend.flush();
    expect( cbResponse[0].name ).toEqual( 'fred' );
  } ) );

  it( 'should maintain success callback when supplied alone for a POST request', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenPOST( /.+/ ).respond( '{"name": "fred"}' );
    var User = $resource( 'api/users/:userid' );
    var cbResponse;
    User.save( function success( response ) {
      cbResponse = response;
    } );
    $httpBackend.flush();
    expect( cbResponse.name ).toEqual( 'fred' );
  } ) );

  it( 'should maintain error callbacks when supplied alone', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond(
      500,
      {
        errors: [
          { propertyName: 'forename', message: "too short" },
        ]
      }
        );
    var User = $resource( 'api/users/:userid' );
    var cbResponse;
    User.query( angular.noop, function success( response ) {
      cbResponse = response.data;
    } );
    $httpBackend.flush();
    expect( cbResponse.errors.length ).toEqual( 1 );
  } ) );

  it( 'should maintain callbacks when supplied with arguments', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond(
      500,
      {
        errors: [
          { propertyName: 'forename', message: "too short" },
        ]
      }
        );
    var User = $resource( 'api/users/:userid' );
    var cbResponse;
    User.query( {}, angular.noop, function success( response ) {
      cbResponse = response.data;
    } );
    $httpBackend.flush();
    expect( cbResponse.errors.length ).toEqual( 1 );
  } ) );

  it( 'should maintain callbacks when supplied with arguments for a POST (hasBody)', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenPOST( /.+/ ).respond( 500, {
        errors: [
          { propertyName: 'forename', message: "too short" },
        ]
      }
    );

    var User = $resource( 'api/users/:userid' );
    var cbResponse;
    User.save( {}, angular.noop, function success( response ) {
      cbResponse = response.data;
    } );

    $httpBackend.flush();
    expect( cbResponse.errors.length ).toEqual( 1 );
  } ) );

  it( 'should be able to append arbitrary data to a request', inject( function( $httpBackend, $resource ) {
    $httpBackend.expectGET( /addedArg=success/ ).respond( [{ name: 'fred' }] );
    var User = $resource( 'api/users/:userid' );
    User.query();
    $httpBackend.flush();
  } ) );

  it( 'should be able to append data to a success response via global callback', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond( [] );
    var User = $resource( 'api/users/:userid' );
    var users = User.query( function success( response ) {
      // we expect to get the value pushed on to the data in success conditions
      expect( response.addedData ).toEqual( 'success' );
    } );
    $httpBackend.flush();
    expect( users.addedData ).toEqual( 'success' );
  } ) );

  it( 'should be able to append data to an error response via global callback', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond( 500, [] );
    var User = $resource( 'api/users/:userid' );
    var users = User.query( angular.noop, function error( response ) {
      expect( response.error ).toEqual( 'error' );
    } );
    $httpBackend.flush();
    expect( users.error ).toEqual( 'error' );
  } ) );

  it( 'should be able to send request args to a successful response', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond( [] );
    var User = $resource( 'api/users/:userid' );
    var users = User.query( { foo: 'bar' } );
    $httpBackend.flush();
    expect( users._meta.requestArgs ).toEqual( { foo: 'bar', addedArg: 'success' } );
  } ) );

  it( 'should be able to send request args to an erroneous response', inject( function( $httpBackend, $resource ) {
    $httpBackend.whenGET( /.+/ ).respond(  500, [] );
    var User = $resource( 'api/users/:userid' );
    var users = User.query( { foo: 'bar' } );
    $httpBackend.flush();
    expect( users._meta.requestArgs ).toEqual( { foo: 'bar', addedArg: 'success' } );
  } ) );

  it( 'should be possible to provide new actions', inject( function( $resource, $httpBackend ) {
    $httpBackend.whenPUT( /api\/users/ ).respond( {} );
    var User = $resource( 'api/users/:userid' );
    // provided by resourceProvider.actions
    expect( angular.isFunction( User.update ) ).toBe( true )
    User.update();
    $httpBackend.flush();
  } ) );

  it( 'should be possible to provide new actions and preserve existing ones', inject( function( $resource, $httpBackend ) {
    var User = $resource( 'api/users/:userid', {}, { uniqueTest: { method: 'GET' } } );
    expect( User.uniqueTest ).toBeDefined(); // provided by $resource instance
    expect( User.get ).toBeDefined(); // provided by $resource defaults
    expect( User.update ).toBeDefined(); // provided by ngynResourceProvider 
  } ) );

  it( 'should update additional parameters on collection after requery', inject( function( $resource, $httpBackend ) {
    $httpBackend.whenGET( /top=1/ ).respond( [{ name: 'fred' }] );
    var User = $resource( 'api/users/:userid' );
    var users = User.query( { top: 1 } );
    $httpBackend.flush();
    expect( users.totalCount ).toEqual( 1 );

    $httpBackend.whenGET( /top=2/ ).respond( [{ name: 'fred' }, { name: 'barney' }] );
    users.requery( { top: 2 } );
    $httpBackend.flush();
    expect( users.totalCount ).toEqual( 2 );
  } ) );
  
  it( 'should allow cancelling of a previous query and only return the value of the latest one ', inject( function( $resource, $httpBackend ) {
    $httpBackend.whenGET( /top=1/ ).respond( [{ name: 'fred' }] );
    $httpBackend.whenGET( /top=2/ ).respond( [{ name: 'fred' }, { name: 'barney' }] );
    var User = $resource( 'api/users/:userid', {}, { query: { method: 'GET', isArray: true, cancellable: true } } );
    var users = User.query( { top: 1 } );
    $httpBackend.flush();
    expect( users.totalCount ).toEqual( 1 );

    var cancelledCallback = jasmine.createSpy();
    var completedCallback = jasmine.createSpy();

    users.requery( { top: 2 }, cancelledCallback );
    users.requery( { top: 1 }, completedCallback );

    $httpBackend.flush();

    expect( completedCallback ).toHaveBeenCalled();
    expect( cancelledCallback ).not.toHaveBeenCalled();
    expect( users.totalCount ).toEqual( 1 );
  } ) );
} );