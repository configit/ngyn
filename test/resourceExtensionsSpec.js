describe( 'resource-extension', function () {
  "use strict";

  beforeEach( function() {
    module( 'ngResource' );
    module( 'cs.modules.resource-extensions' );
    inject(function($httpBackend) {
      $httpBackend.whenGET(/\?surname=flintstone/).respond('[{"name": "fred"}]');
      $httpBackend.whenGET(/\?surname=rubble/).respond('[{"name": "barney"}]');
    });
  } );

  it('should be able to requery a resource', inject(function ($resource, $httpBackend) {
    var User = $resource('api/users/:userid');

    var users = User.query({surname:'flintstone'});
    $httpBackend.flush();
    expect(users[0].name).toEqual('fred');

    users.requery({surname:'rubble'});
    $httpBackend.flush();
    expect(users[0].name).toEqual('barney');
  }));

  it('should return mocked header when using resource', inject(function ($resource, $httpBackend) {
    $httpBackend.whenGET('api/users').respond(200, [{name: "fred"}], {totalCount: "2"}
    );
    var totalCount = 0;

    var User = $resource('api/users/:userid');
    var users = User.query(function (data, headerFn) {
      totalCount = headerFn('totalCount');
    });

    $httpBackend.flush();
    expect(totalCount).toBe('2');

  }));

  it('should retrieve totalCount from headers', inject(function ($resource, $httpBackend, $http) {
    $httpBackend.whenGET(/\$top=1/).respond(200, [{name: "fred"}], {totalCount: "2"});
    var User = $resource('api/users/:userid');
    var totalCount;

    var users = User.query( { $top:1 }, function (data, headerFn) {
      totalCount = headerFn('totalCount');
    } );

    $httpBackend.flush();
    expect(totalCount).toEqual('2');

  }));

  it('should retrieve totalCount from collection', inject(function ($resource, $httpBackend, $http) {
    $httpBackend.whenGET(/\$top=1/).respond(200, [{name: "fred"}], {totalCount: "2"});
    var User = $resource('api/users/:userid');

    var users = User.query( { $top:1 }, function (data, headerFn) {
      expect(data.totalCount).toEqual(2);
    } );

    $httpBackend.flush();
    expect(users.totalCount).toEqual(2);

  }));

  iit('should attach errors to collection and persist data', inject(function ($resource, $httpBackend, $http) {
    $httpBackend.whenGET(/\$top=1/).respond(500, { errors: [{broken: "broken"}] } );
    var User = $resource('api/users/:userid');

    var users = User.query( { $top:1 }, function() {}, function (response) {
      // inherently works as we get the raw response
      expect(response.data.errors.length).toEqual(1);
    } );

    $httpBackend.flush();
    // would not work without modification as it doesn't unwrap the response
    expect(users.errors.length).toEqual(1);

  }));

  it('should set totalCount to collection length if no header', inject(function ($resource, $httpBackend, $http) {
    $httpBackend.whenGET(/\$top=1/).respond(200, [{name: "fred"}, {name:'barney'}]);
    var User = $resource('api/users/:userid');

    var users = User.query( { $top:1 }, function (data, headerFn) {
      expect(data.totalCount).toEqual(2);
    } );

    $httpBackend.flush();
    expect(users.totalCount).toEqual(2);

  }));

  it('should return different results when paged', inject(function ($resource, $httpBackend, $http) {
    var User = $resource('api/users/:userid');

    // get first page
    $httpBackend.whenGET(/\$skip=0\&\$top=1/).respond(200, [{name: "fred"}]);
    var users = User.query( { $top:1, $skip:0 } );
    $httpBackend.flush();
    expect(users[0].name).toEqual('fred');

    // get second page
    $httpBackend.whenGET(/\$skip=1\&\$top=1/).respond(200, [{name: "barney"}]);
    users.requery( { $top:1, $skip:1 } );
    $httpBackend.flush();
    expect(users[0].name).toEqual('barney');

  }));

});