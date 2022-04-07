'use strict';
angular.module( 'ngynServerConnection' )

  /**
   * Implements the ServerConnectionBackendCore specifically to pass through to signalr
   */
  .factory( 'ServerConnectionBackendCore', [ function() {

    function ServerConnectionBackendCore() {

      var disconnectFns = [];
      this.onDisconnect = function( fn ) {
        disconnectFns.push( fn );
      };

      var connections = {};
      this.getConnection = function( hubName ) {

        var connection = connections[hubName];
        if(connection){
          return connection;
        }  
        var hubConnectionBuilder = new signalR.HubConnectionBuilder();
        
        var transportProtocols =
        signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling | signalR.HttpTransportType.ServerSentEvents;

        hubConnectionBuilder.withUrl('hubs/' + hubName, { transport: transportProtocols, withCredentials: true });
    
        hubConnectionBuilder.withAutomaticReconnect();
    
        connection = hubConnectionBuilder.build();

        connection.onclose( function() {
          angular.forEach(disconnectFns, function (fn) {
            fn();
          } );
        } );

        connections[hubName] = connection;
        return connection;
      };

      /**
       * Establish a connection to the hub
       */
       this.start = function( hubName ) {
        try {
          var result = this.getConnection( hubName ).start();
          console.log( 'Connecting to SignalR ' + hubName );
        } catch ( exception ) {
          console.error( exception );
        }
        return result;
      };

      /**
       * Terminate the connection to the hub
       */
      this.stop = function( hubName ) {
        return this.getConnection( hubName ).stop();
      };

      /**
       * Subscribes to the method on the server, invoking the given function when that method is fired
       * @param {string} hubName - The name of the hub on which the methods are located
       * @param {string} methodName - The name of the method to listen to being fired by the server
       * @param {function} fn - The function to invoke when the method is fired on the hub
       */
      this.on = function( hubName, methodName, fn ) {
        this.getConnection( hubName ).on( methodName, fn );
      };

      this.off = function( hubName, methodName ) {
        this.getConnection( hubName ).off( methodName );
      };

      this.getMethodNames = function( hubName ) {
        return this.getConnection( hubName ).invoke('functionList')
        .then(function(result) {return result;})
        .catch(function(err) {console.error(err);});
      };

      /**
       * Retrieves the object which contains the server methods related to the specified hub.
       * the server object returned expects angular promises, so the ones SignalR returns are converted
       */
      this.callServer = function( hubName, methodName, args, successCallback, failureCallback, progressCallback ) {
        this.getConnection( hubName ).invoke( methodName, args ).then(
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
