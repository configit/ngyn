'use strict';
/**
 * Mock implementation of ServerConnectionBackend to allow ServerConnection to be tested
 * This is analogous to $httpBackend and provides similar capabilities
 *
 * Usage:
 *     var TestHub = new ServerConnection( 'TestHub' );
 *     mockBackend.addServerMethods( 'TestHub', ['run', 'abort'] );
 *     mockBackend.completeConnection();
 *     TestHub.server.run();
 *     expect( TestHub.server.callCount ).toBe( 1 );
 *
 *
 */
angular.module( 'ngynMocks', [] ).factory( 'ServerConnectionBackend', function( $rootScope, $timeout ) {
  return new ServerConnectionBackend( $rootScope, $timeout );
} );

/* jshint -W003 */
var ServerConnectionBackend = function( $rootScope, $timeout ) {
  var self = this;
  var doneFns = [];
  var clientMethods = {};
  var pendingServerRequests = [];
  var disconnectFn = null;

  self.serverMethods = {};

  /* Debug helpers for inspecting current state */

  this._connected = false;
  this._connecting = false;

  /* ServerConnectionBackend mocked methods - see ServerConnectionBackend.js for details */

  this.logging = function() { return true; };

  this.getMethodNames = function( hubName ) {
    if ( !self.serverMethods[hubName] ) {
      return [];
    }

    return Object.keys( self.serverMethods[hubName] );
  };

  this.callServer = function( hubName, methodName, args, successCallback, failureCallback, progressCallback ) {
    return self.serverMethods[hubName][methodName].apply( null, args ).then(
      function success( response ) {
        successCallback( response );
      }, function failure( response ) {
        failureCallback( response );
      }, function progress( response ) {
        progressCallback( response );
      } );
  };

  this.start = function() {
    if ( this._connecting ) {
      throw new Error( 'Connection attempt is already in progress' );
    }
    if ( this._connected ) {
      throw new Error( 'Connection already established' );
    }
    this._connecting = true;
    return {
      done: function( doneFn ) {
        doneFns.push( doneFn );
      }
    };
  };

  this.stop = function() {
    if ( !this._connected ) {
      throw new Error( 'Connection already stopped' );
    }
    this._connected = false;
  };

  this.on = function( hubName, methodName, fn ) {
    var events = ( clientMethods[hubName] = clientMethods[hubName] || {} );
    var methods = ( events[methodName] = events[methodName] || [] );
    methods.push( fn );
  },

  this.off = function( hubName, methodName ) {
    var events = ( clientMethods[hubName] = clientMethods[hubName] || {} );
    if ( events[methodName] ) {
      events[methodName].length = 0;
    }
  },

  this.onDisconnect = function( fn ) {
    disconnectFn = fn;
  },

  /* Helpers */

  /**
   * Sets up the backend to expose methods with the names given in fnNames to the ServerConnection,
   * these are exposed on ServerConnection.server and can be called directly.
   * When mocked, each function has a callCount property available for inspection in tests
   * @param {string} hubName - The name of the hub on which to mock the server methods
   * @param {object} fns - The names and bodies of the functions to have created on the ServerConnection as a key/value pair
   */
  this.addServerMethods = function( hubName, fns ) {
    self.serverMethods[hubName] = self.serverMethods[hubName] || [];
    angular.forEach( Object.keys( fns ), function( fnKey ) {
      var fn = fns[fnKey];
      self.serverMethods[hubName][fnKey] = function() {
        var args = [].splice.call( arguments, 0 );
        self.serverMethods[hubName][fnKey].callCount++;
        var defer = jQuery.Deferred();
        pendingServerRequests.push( { defer: defer, fn: fn, args: args } );
        return defer.promise();
      };
      self.serverMethods[hubName][fnKey].callCount = 0;
    } );
  };

  /**
   * Emulates the server accepting and completing all requested server invoked methods.
   * Triggers all registered server.myMethod().then(...) handlers
   */
  this.flush = function() {
    while ( pendingServerRequests.length > 0 ) {
      var request = pendingServerRequests.pop();
      var requestResponse = request.fn.apply( this, request.args );
      request.defer.resolve( requestResponse );
      $timeout.flush();
    }
  };
  /**
   * Emulates an event being fired by the server and will invoke the ServerConnection's registered handlers
   */
  this.trigger = function( hubName, fnName ) {
    if ( !this._connected ) {
      throw new Error( 'Cannot trigger server method as the current connection is not open' );
    }
    var args = [].splice.call( arguments, 2 );
    var fns = clientMethods[hubName][fnName];
    angular.forEach( fns, function( fn ) {
      fn.apply( null, args );
    } );
  };

  /*
   * Emulates the server accepting and completing the long-running connection.
   * Triggers all registered connect().done(...) handlers
   */
  this.completeConnection = function() {
    if ( !this._connecting ) {
      throw new Error( 'Connection attempt is not in progress' );
    }
    this._connected = true;
    this._connecting = false;
    angular.forEach( doneFns, function( doneFn ) {
      doneFn();
    } );
    $timeout.flush();
  };

  /*
   * Emulates the server connection dropping unexpectedly
   */
  this.severConnection = function() {
    this._connected = false;
    disconnectFn();
  };
};
