describe( 'resource-extension', function () {
  "use strict";

  beforeEach( function() {
    module( 'ngResource' );

    angular.module('cs.modules.config', [])
      .value('cs.modules.config', {
        resource: {
          additionalArgs: function () {
            return { addedArg:'success' };
          },
          success: function (response) {
            response.addedData = 'response-success';
            this.addedData = 'data-success';
          },
          error: function (response) {
            response.error = 'response-error';
            this.error = 'data-error';
          }
        }
      });

    module( 'cs.modules.resource' );
  });

  it('should be able to requery a resource', inject(function ($resource, $httpBackend) {
    $httpBackend.whenGET(/surname=flintstone/).respond('[{"name": "fred"}]');
    $httpBackend.whenGET(/surname=rubble/).respond('[{"name": "barney"}]');

    var User = $resource('api/users/:userid');

    var users = User.query({surname:'flintstone'});
    $httpBackend.flush();
    expect(users[0].name).toEqual('fred');

    users.requery({surname:'rubble'});
    $httpBackend.flush();
    expect(users[0].name).toEqual('barney');
  }));

  it('should return mocked header when using resource', inject(function ($resource, $httpBackend) {
    $httpBackend.whenGET(/api\/users/).respond(200, [{name: "fred"}], {totalCount: "2"});
    var totalCount = 0;

    var User = $resource('api/users/:userid');
    var users = User.query(function (data, headerFn) {
      totalCount = headerFn('totalCount');
    });

    $httpBackend.flush();
    expect(totalCount).toBe('2');
  }));

  it('should maintain success callback when supplied alone', inject(function ($httpBackend, $resource) {
    $httpBackend.whenGET(/.+/).respond('[{"name": "fred"}]');
    var User = $resource('api/users/:userid');
    var cbResponse;
    var users = User.query(function success ( response ) {
      cbResponse = response;
    });
    $httpBackend.flush();
    expect(cbResponse[0].name).toEqual('fred');
  }));

  it('should maintain error callbacks when supplied alone', inject(function ($httpBackend, $resource) {
    $httpBackend.whenGET(/.+/).respond(
      500, 
      { errors: [
        {propertyName: 'forename', message: "too short"}, 
        ] }
    );
    var User = $resource('api/users/:userid');
    var cbResponse;
    var users = User.query(angular.noop ,function success ( response ) {
      cbResponse = response.data;
    });
    $httpBackend.flush();
    expect(cbResponse.errors.length).toEqual(1);
  }));

  it('should maintain callbacks when supplied with arguments', inject(function ($httpBackend, $resource) {
    $httpBackend.whenGET(/.+/).respond(
      500, 
      { errors: [
        {propertyName: 'forename', message: "too short"}, 
        ] }
    );
    var User = $resource('api/users/:userid');
    var cbResponse;
    var users = User.query({}, angular.noop ,function success ( response ) {
      cbResponse = response.data;
    });
    $httpBackend.flush();
    expect(cbResponse.errors.length).toEqual(1);    
  }));

  it('should be able to append arbitrary data to a request', inject(function($httpBackend, $resource) {
    $httpBackend.expectGET(/addedArg=success/).respond([{name: 'fred'}]);
    var User = $resource('api/users/:userid');
    var users = User.query();
    $httpBackend.flush();
  }));

  it('should be able to append data to a success response via global callback', inject(function($httpBackend, $resource) {
    $httpBackend.whenGET(/.+/).respond([])
    var User = $resource('api/users/:userid');
    var users = User.query(function success (response) {
      // we expect to get the value pushed on to the data in success conditions
      expect(response.addedData).toEqual('data-success');
    });
    $httpBackend.flush();
    expect(users.addedData).toEqual('data-success');
  }));

  it('should be able to append data to an error response via global callback', inject(function($httpBackend, $resource) {
    $httpBackend.whenGET(/.+/).respond(500, [])
    var User = $resource('api/users/:userid');
    var users = User.query(angular.noop, function error (response) {
      expect(response.error).toEqual('response-error');
    });
    $httpBackend.flush();
    expect(users.error).toEqual('data-error');
  }));

});