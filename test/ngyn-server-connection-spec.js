describe( 'ServerConnection', function() {
  'use strict';

  var ChatMessages, Participants;
  var backend;

  beforeEach( function() {
    module( 'ngynServerConnection', 'ngynMocks' );

    inject( function( ServerConnection, ServerConnectionBackend ) {
      ChatMessages = ServerConnection( 'ChatMessages' );
      Participants = ServerConnection( 'Participants' );
      backend = ServerConnectionBackend;
    } );
  } );

  afterEach( function() {
    if ( backend._connected ) {
      backend.stop();
    }
  } );

  describe( 'connection management', function() {

    it( 'should automatically open an underlying connection when a service connects', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      expect( backend._connected ).toBe( false );
      ChatMessages.connect( scope );
      backend.completeConnection();
      expect( backend._connected ).toBe( true );
    } ) );

    it( 'should not try to open an underlying connection when a second service connects', inject( function( $rootScope ) {
      spyOn( backend, 'start' ).andCallThrough();
      var scope = $rootScope.$new();
      ChatMessages.connect( scope );
      backend.completeConnection();
      Participants.connect( scope );
      expect( backend.start.callCount ).toBe( 1 );
    } ) );

    it( 'should automatically close the underlying connection when all services disconnect', inject( function( $rootScope ) {
      spyOn( backend, 'stop' ).andCallThrough();
      var scope = $rootScope.$new();
      ChatMessages.connect( scope );
      backend.completeConnection();
      expect( backend.stop ).not.toHaveBeenCalled();
      scope.$destroy();
      expect( backend.stop ).toHaveBeenCalled();
    } ) );

    it( 'should close the connection after a parent scope is destroyed', inject( function( $rootScope ) {
      spyOn( backend, 'stop' ).andCallThrough();
      var scope = $rootScope.$new();
      ChatMessages.connect( scope );
      Participants.connect( scope.$new() );
      backend.completeConnection();
      scope.$destroy();
      expect( backend.stop ).toHaveBeenCalled();
    } ) );

    it( 'should not close the connection when a child scope is destroyed', inject( function( $rootScope ) {
      spyOn( backend, 'stop' ).andCallThrough();
      var scope = $rootScope.$new();
      ChatMessages.connect( scope );
      var scope2 = scope.$new();
      Participants.connect( scope2 );
      backend.completeConnection();
      scope2.$destroy();
      expect( backend.stop ).not.toHaveBeenCalled();
    } ) );

    it( 'should trigger done events when the server establishes the connection', inject( function( $rootScope ) {
      var connected = false;
      var scope = $rootScope.$new();
      ChatMessages.connect( scope ).done( function() { connected = true; } );
      expect( connected ).toBe( false );
      backend.completeConnection();
      expect( connected ).toBe( true );
    } ) );

    it( 'should trigger done events immediately if the server connection is already established', inject( function( $rootScope, $timeout ) {
      var connected1 = false;
      var connected2 = false;
      var scope = $rootScope.$new();
      Participants.connect( scope ).done( function() { connected1 = true; } );
      backend.completeConnection();
      ChatMessages.connect( scope ).done( function() { connected2 = true; } );
      expect( connected1 ).toBe( true );
      $timeout.flush();
      expect( connected2 ).toBe( true );
    } ) );
  } );

  describe( 'server invoked events', function() {

    it( 'should attempt to reconnect if a connection is required and the underlying connection drops', inject( function( $rootScope, $timeout ) {
      spyOn( backend, 'start' ).andCallThrough();

      var scope = $rootScope.$new();
      var messagesReceived = 0;
      ChatMessages.connect( scope, { messageReceived: function() { messagesReceived++; } } );
      backend.completeConnection();

      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( backend.start.callCount ).toBe( 1 );
      backend.severConnection();
      // ServerConnection will automatically call start again if a connection is still required
      $timeout.flush();
      expect( backend.start.callCount ).toBe( 2 );

      // Ensure the conection still works as it did before
      backend.completeConnection();
      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( messagesReceived ).toBe( 2 );
    } ) );

    it( 'Should not reconnect if the connection is no longer needed', inject( function( $rootScope ) {
      spyOn( backend, 'start' ).andCallThrough();

      var scope = $rootScope.$new();
      var messagesReceived = 0;
      ChatMessages.connect( scope, { messageReceived: function() { messagesReceived++; } } );
      backend.completeConnection();
      expect( backend.start.callCount ).toBe( 1 );
      scope.$destroy();
      backend.severConnection();
      // ensure the connection wasn't started again as it is no longer needed
      expect( backend.start.callCount ).toBe( 1 );

    } ) );

    it( 'should trigger registered method when server invocation happens', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      var received = false;
      ChatMessages.connect( scope, { messageReceived: function() { received = true; } } );
      backend.completeConnection();
      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( received ).toBe( true );
    } ) );

    it( 'should trigger only the registered method when server invocation happens', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      var received = false;
      var received2 = false;
      ChatMessages.connect( scope, { messageReceived: function() { received = true; }, messageReceived2: function() { received2 = true; } } );
      backend.completeConnection();
      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( received ).toBe( true );
      expect( received2 ).toBe( false );
    } ) );

    it( 'should trigger multiple registered methods when server invocation happens', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      var received = false, received2 = false;
      ChatMessages.connect( scope, { messageReceived: function() { received = true; } } );
      ChatMessages.connect( scope, { messageReceived: function() { received2 = true; } } );
      backend.completeConnection();
      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( received ).toBe( true );
      expect( received2 ).toBe( true );
    } ) );

    it( 'should stop triggering registered methods when scope is destroyed', inject( function( $rootScope ) {
      /*
       * we must use 2 scopes in this test as destroying one will close the underlying connection and the backend will
       be unable to get messages to us.
       */
      var scope = $rootScope.$new();
      var scope2 = $rootScope.$new();
      var received = false;
      ChatMessages.connect( scope, { messageReceived: function() { received = true; } } );
      Participants.connect( scope2 );
      backend.completeConnection();
      scope.$destroy();
      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( received ).toBe( false );
    } ) );

    it( 'should not stop triggering registered methods when an unrelated scope is destroyed', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      var scope2 = $rootScope.$new();
      var received = false, received2 = false;
      ChatMessages.connect( scope, { messageReceived: function() { received = true; } } );
      ChatMessages.connect( scope2, { messageReceived: function() { received2 = true; } } );
      backend.completeConnection();
      scope2.$destroy();
      backend.trigger( 'ChatMessages', 'messageReceived' );
      expect( received ).toBe( true );
      expect( received2 ).toBe( false );
    } ) );

    it( 'should deregister the proxy event handler when the single listener is removed', inject( function( $rootScope ) {
      spyOn( backend, 'on' ).andCallThrough();
      spyOn( backend, 'off' ).andCallThrough();
      var scope = $rootScope.$new();
      ChatMessages.connect( scope, { messageReceived: function() { } } );
      expect( backend.on ).toHaveBeenCalled();
      backend.completeConnection();
      scope.$destroy();
      expect( backend.off ).toHaveBeenCalled();
    } ) );

    it( 'should not deregister the proxy event handler when only the first of 2 handlers is removed', inject( function( $rootScope ) {
      spyOn( backend, 'on' ).andCallThrough();
      spyOn( backend, 'off' ).andCallThrough();
      var scope = $rootScope.$new();
      var scope2 = $rootScope.$new();
      ChatMessages.connect( scope, { messageReceived: function() { } } );
      ChatMessages.connect( scope2, { messageReceived: function() { } } );
      expect( backend.on.callCount ).toBe( 1 );
      backend.completeConnection();
      scope.$destroy();
      expect( backend.off ).not.toHaveBeenCalled();
      scope2.$destroy();
      expect( backend.off ).toHaveBeenCalled();
    } ) );
  } );

  describe( 'client invoked events', function() {
    it( 'should send function invocation request to server', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { say: angular.noop } );

      ChatMessages.connect( scope ).done( function() {
        ChatMessages.server.say( 'hello' );
        expect( backend.server( 'ChatMessages' ).say.callCount ).toBe( 1 );
        ChatMessages.server.say( 'world' );
        expect( backend.server( 'ChatMessages' ).say.callCount ).toBe( 2 );
      } );

      backend.completeConnection();
    } ) );

    it( 'should immediately return the response from the server with parameters', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      var initialCounts = { room1: 5, room2: 10 };
      var resultCounts = {};
      backend.addServerMethods( 'Participants', { getCount: function( roomName ) { return initialCounts[roomName]; } } );

      Participants.connect( scope ).done( function() {
        Participants.server.getCount( 'room1' ).then( function( count ) { resultCounts.room1 = count; } );
        Participants.server.getCount( 'room2' ).then( function( count ) { resultCounts.room2 = count; } );

        backend.flush();

        expect( resultCounts.room1 ).toBe( initialCounts.room1 );
        expect( resultCounts.room2 ).toBe( initialCounts.room2 );
      } );

      backend.completeConnection();
    } ) );

    it( 'should throw a meaningful error when the server is called before the connection is complete', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { say: angular.noop } );

      ChatMessages.connect( scope );
      var sayFn = function() { ChatMessages.server.say( 'hello' ); };
      expect( sayFn ).toThrow( new Error( "Cannot call the say function on the ChatMessages hub because the server connection is not established. Place your server calls within the connect(...).done() block" ) );

    } ) );

    it( 'should be able to use the hub after connection, outside of done after connection has completed', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { say: angular.noop } );

      ChatMessages.connect( scope );
      backend.completeConnection();

      ChatMessages.server.say( 'hello' );
      expect( backend.server( 'ChatMessages' ).say.callCount ).toBe( 1 );
    } ) );
  } );

  describe( 'Response interceptors', function() {
    beforeEach( function() {
      ChatMessages.responseInterceptors.push( function( hubName, methodName, args ) { return [{ rewrittenObject: true }] } );
    }
    );

    it( 'should unbox typed return values from SignalR', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { getAll: function() { return { $type: 'SomeClrType', $values: [{ text: 'Message1' }, { text: 'Message2' }] }; } } );

      var response;
      ChatMessages.connect( scope ).done( function() {
        ChatMessages.server.getAll().then( function( messages ) { response = messages; } );

        backend.flush();

        expect( response.rewrittenObject ).toBeDefined();
      } );

      backend.completeConnection();
    } ) );

    it( 'should unbox typed return values from SignalR using done', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { getAll: function() { return { $type: 'SomeClrType', $values: [{ text: 'Message1' }, { text: 'Message2' }] }; } } );

      var response;
      ChatMessages.connect( scope ).done( function() {
        ChatMessages.server.getAll().done( function( messages ) { response = messages; } );

        backend.flush();

        expect( response.rewrittenObject ).toBeDefined();
      } );

      backend.completeConnection();
    } ) );

    it( 'should call all chained methods', inject( function( $rootScope ) {
      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { getAll: function() { return { $type: 'SomeClrType', $values: [{ text: 'Message1' }, { text: 'Message2' }] }; } } );

      var response, response2;
      ChatMessages.connect( scope ).done( function() {
        ChatMessages.server.getAll()
          .then( function( messages ) { response = messages; } )
          .then( function( messages ) { response2 = messages; } );

        backend.flush();

        expect( response.rewrittenObject ).toBeDefined();
        expect( response2.rewrittenObject ).toBeDefined();
      } );

      backend.completeConnection();
    } ) );
  } );

  describe( 'Default Response interceptors', function() {
    it( 'the built in jsonNetStipper formatter should work', inject( function( $rootScope, defaultResponseInterceptors ) {
      ChatMessages.responseInterceptors.push( defaultResponseInterceptors.jsonNetStripper );

      var scope = $rootScope.$new();
      backend.addServerMethods( 'ChatMessages', { getAll: function() { return { $type: 'SomeClrType', $values: [{ text: 'Message1' }, { text: 'Message2' }] }; } } );

      var response;
      ChatMessages.connect( scope ).done( function() {
        ChatMessages.server.getAll().done( function( messages ) { response = messages; } );

        backend.flush();

        expect( angular.isArray( response ) ).toBe( true );
      } );

      backend.completeConnection();
    } ) );
  } );
} );