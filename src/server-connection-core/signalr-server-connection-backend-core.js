'use strict';
angular.module( 'ngynServerConnection' )

  /**
   * Implements the ServerConnectionBackendCore specifically to pass through to signalr
   */
  .factory( 'ServerConnectionBackendCore', [ function() {

    function ServerConnectionBackendCore() {

      var connection = {};
      function getConnection( hubName ) {

        if(connection && connection.state == HubConnectionState.Connected){
          return connection;
        }  
        var hubConnectionBuilder = new HubConnectionBuilder();
        
        var transportProtocols =
        HttpTransportType.WebSockets | HttpTransportType.LongPolling | HttpTransportType.ServerSentEvents;

        hubConnectionBuilder.withUrl('hubs/' + hubName, { transport: transportProtocols });
    
        hubConnectionBuilder.withAutomaticReconnect();
    
        connection = hubConnectionBuilder.build();
        return connection;
      };

      /**
       * Establish a connection to the hub
       */
      this.start = function( hubName ) {
        try {
          getConnection( hubName ).start();
          console.log( 'SignalR Connected.' );
        } catch ( exception ) {
          console.error( exception );
        }
      };

      /**
       * Terminate the connection to the hub
       */
      this.stop = function( hubName ) {
        return getConnection( hubName ).stop();
      };

      /**
       * Subscribes to the method on the server, invoking the given function when that method is fired
       * @param {string} hubName - The name of the hub on which the methods are located
       * @param {string} methodName - The name of the method to listen to being fired by the server
       * @param {function} fn - The function to invoke when the method is fired on the hub
       */
      this.on = function( hubName, methodName, fn ) {
        getConnection( hubName ).on( methodName, fn );
      };

      this.off = function( hubName, methodName ) {
        getConnection( hubName ).off( methodName );
      };

      var disconnectFns = [];
      this.onDisconnect = function( fn ) {
        disconnectFns.push( fn );
      };

      getConnection('').onclose( function() {
        angular.forEach(disconnectFns, function (fn) {
          fn();
        } );
      } );

      this.getMethodNames = function( hubName ) {
        var functionsList = [];
        getConnection( hubName ).invoke('functionList')
        .then(function(result) {functionsList = result;})
        .catch(function(err) {console.error(err);});
        return functionsList;
      };

      /**
       * Retrieves the object which contains the server methods related to the specified hub.
       * the server object returned expects angular promises, so the ones SignalR returns are converted
       */
      this.callServer = function( hubName, methodName, args, successCallback, failureCallback, progressCallback ) {
        getConnection( hubName ).invoke( methodName, args ).then(
          function success( response ) {
            successCallback( response );
          }, function failure( response ) {
            failureCallback( response );
          }, function progress( response ) {
            progressCallback( response );
          }
        );
      };

    }
    return new ServerConnectionBackendCore();
  } ] );
