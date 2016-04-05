angular.module( 'ngynSignalRServerConnectionBackend', [] )
  /**
   * The service circumvents the intended behaviour of SignalR with regards to client side methods. 
   * (http://stackoverflow.com/a/15074002/187157)
   * We patch SignalR to ensure each hub has at least one client method registered
   * so that a the hub is is ensured to be active when the connection is established.
   * Once connected we can no longer push methods on to hub.client so from there
   * we must use hubProxy.on(...) to subscribe to server invoked methods.
   */
  .run( function() {
    angular.forEach( Object.keys( $.connection ), function( hubKey ) {
      var hub = $.connection[hubKey];
      // Any hub published on $.connection has a hubName property 
      if ( hub.hubName ) {
        hub.client.noop = angular.noop;
      }
    } );
  } )

  /**
   * Implements the ServerConnectionBackend specifically to pass through to signalr
   */
  .factory( 'ServerConnectionBackend', [ '$q', function( $q ) {

    function ServerConnectionBackend() {
      /**
       * Establish a connection to the hub
       */
      this.start = function() {
        var args = [].splice.call( arguments, 0 );
        // omit forever frame to aid testing
        args.splice( 0, 0, { transport: ['webSockets', 'serverSentEvents', 'longPolling'] } );
        return $.connection.hub.start.apply( $.connection.hub, args );
      };

      /**
       * Terminate the connection to the hub
       */
      this.stop = function() {
        return $.connection.hub.stop.apply( $.connection.hub, arguments );
      };

      /**
       * Sets or retrieves the logging property.
       * The logging property determines if debug messages within the ServerConnection are emitted.
       * Setting this property to true also turns on signalr client side logging.
       *
       * Called without a parameter this method retrieves the logging status.
       * Called with a parameter it sets the logging status to the value passed in.
       */
      this.logging = function( enabled ) {
        if ( arguments.length > 0 ) {
          $.connection.hub.logging = enabled;
        }
        else {
          return $.connection.hub.logging;
        }
      };

      /**
       * Subscribes to the method on the server, invoking the given function when that method is fired
       * @param {string} hubName - The name of the hub on which the methods are located
       * @param {string} methodName - The name of the method to listen to being fired by the server
       * @param {function} fn - The function to invoke when the method is fired on the hub
       */
      this.on = function( hubName, methodName, fn ) {
        var proxy = $.connection[hubName];
        proxy.on( methodName, fn );
      };

      this.off = function( hubName, methodName ) {
        var proxy = $.connection[hubName];
        proxy.off( methodName );
      };

      var disconnectFns = [];
      this.onDisconnect = function( fn ) {
        disconnectFns.push( fn );
      };

      $.connection.hub.disconnected( function() {
        angular.forEach(disconnectFns, function (fn) {
          fn();
        } );
      } );

      /**
       * Retrieves the object which contains the server methods related to the specified hub.
       * the server object returned expects angular promises, so the ones SignalR returns are converted
       */
      this.server = function( hubName ) {
        var serverInstance = {};
        angular.forEach( Object.keys( $.connection[hubName].server ), function( serverMethodKey ) {
          var defer = $q.defer();

          serverInstance[serverMethodKey] = function() {
            var args = [].splice.call( arguments, 0 );
            var nativePromise = $.connection[hubName].server[serverMethodKey].apply( this, args );
            nativePromise.then( function success( value ) {
              defer.resolve( value );
            }, function failure( reason ) {
              defer.reject( reason );
            } );
            return defer.promise;
          }
        } );

        return serverInstance;
      };
    };
    return new ServerConnectionBackend();
  } ] );
