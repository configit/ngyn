"use strict";
angular
  .module("ngynServerConnection")
  /**
   * A factory which creates a ServerConnectionCore object that lets you interact with a realtime
   * server connection technology such as SignalR; this underlying technology is expected to be
   * dependency injected as the ServerConnectionBackendCore service.
   *
   * This one implementation based on @microsoft/signalr library, which allows to interact with .Net Core/6 signalR server implementation.
   * The old one is not compatible with .Net Core/6 server side.
   *
   * The primary purpose of ServerConnectionCore is to provide automatic connection management, automatically
   * starting the underlying connection when the first provider requests it and stopping it when all are no
   * longer requesting it.
   *
   * The secondary purpose is automatic disposal of instance connections.
   * Each connection registration is tied to a scope, once the scope is destroyed the connection request
   * is popped off the stack and the connection may be closed as described above.
   *
   * Usage:
   *    var myhub = new ServerConnectionCore('MyHub');
   *    myHub.connect( scope, { onMyEvent: function( e ) { console.log( e ) } } )
   */
  .factory(
    "ServerConnectionCore",
    function (ServerConnectionBackendCore, $log, $timeout) {
      var reconnectTimeout = 5000; // amount of time to wait between losing the connection and reconnecting
      var openConnections = [];

      function log(message) {
        $log.info(message);
      }

      /**
       * Creates a new ServerConnectionCore tied to the hub specified by the name parameter
       * @constructor
       */
      var ServerConnectionCore = function (name) {
        var self = this;
        var allListeners = {};
        var connectionOpen = false;
        this.responseInterceptors = [];

        /**
         * Deregisters the intended connection for this instance.
         * If it is the last, it closes the underlying connection.
         */
        function stopListening(scope) {
          var isLastScopeListening = openConnections.length === 1;
          for (var i = 0; i < openConnections.length; i++) {
            if (openConnections[i].scope === scope) {
              openConnections.splice(i, 1);
              break;
            }
          }

          if (isLastScopeListening) {
            log(
              "[ServerConnectionCore] all listeners unregistered, closing SignalR connection"
            );
            ServerConnectionBackendCore.stop(name);
            connectionOpen = false;
          }
        }

        function createServerProxy(hubName) {
          return ServerConnectionBackendCore.getConnection(hubName);
        }

        /**
         * Creates the server property on the instance and fires all done handlers.
         * When this is the first connection it is triggered when the underlying connection completes.
         * If the connection is already open it is triggered immediately.
         */
        function completeConnection(handler) {
          handler.hub.server = createServerProxy(handler.hubName);
          handler.doneFn();
        }

        /**
         * Automatically reconnect when the backend disconnects whilst an open connection is still required
         */
        ServerConnectionBackendCore.onDisconnect(name, function () {
          if (openConnections.length < 1) {
            // The connection is no longer required so don't bother reconnecting
            return;
          }

          log(
            "[ServerConnectionCore] Received disconnected message whilst a connection is still required. Reconnecting in " +
              reconnectTimeout +
              "ms"
          );

          $timeout(
            function () {
              connectionOpen = false;
              ServerConnectionBackendCore.start(name).then(function () {
                connectionOpen = true;
              });
            },
            reconnectTimeout,
            false // do not invoke apply
          );
        });

        /**
         * Registers an intended connection for this instance.
         * If it is the first it opens the underlying connection.
         * @param {object} scope - The angular scope to tied this connection registration to
         * @param {object} [listeners] - A key/value pair where key is the name of the method to subscribe to and value is the function to call when triggered
         */
        self.connect = function (scope, listeners) {
          listeners = listeners || {};
          self.server = {};

          angular.forEach(Object.keys(listeners), function (listenerKey) {
            if (!allListeners[listenerKey]) {
              allListeners[listenerKey] = [];
            }

            log(
              "[ServerConnectionCore] pushing on listener for " +
                name +
                "." +
                listenerKey
            );

            // if the function wrapper is not already there, push it on
            if (allListeners[listenerKey].length === 0) {
              ServerConnectionBackendCore.on(
                name,
                listenerKey,
                listeners[listenerKey]
              );
            }

            allListeners[listenerKey].push({
              scope: scope,
              listener: listeners[listenerKey],
            });
          });

          /**
           * When the scope to which this connection is tied to is destroyed, we deregister the connection
           * and remove any methods subscribed to at connection time. If there are no longer any methods across
           * all hubs listening to this event we remove the underlying connection's event hook.
           */
          var onDestroy = function () {
            stopListening(scope);

            angular.forEach(Object.keys(allListeners), function (methodKey) {
              var hubMethods = allListeners[methodKey];
              for (var j = hubMethods.length - 1; j >= 0; j--) {
                if (hubMethods[j].scope === scope) {
                  hubMethods.splice(j, 1);
                }
              }
              if (hubMethods.length === 0) {
                ServerConnectionBackendCore.off(name, methodKey);
              }
            });
          };

          scope.$on("$destroy", onDestroy);

          var doneHandler = {
            scope: scope,
            doneFn: angular.noop,
            hubName: name,
            hub: self,
          };

          if (
            !connectionOpen &&
            !openConnections.some(function (x) {
              return x.name === name;
            })
          ) {
            log(
              "[ServerConnectionCore] listeners registered, opening SignalR connection"
            );
            ServerConnectionBackendCore.start(name).finally(function () {
              connectionOpen = true;
              completeConnection(doneHandler);
            });
          }

          openConnections.push({ name: name, scope: scope, doneFns: [] });

          var connectionState = {
            done: function (doneFn) {
              // modify original (empty) done handler as one has been explicitly specified
              doneHandler.doneFn = doneFn;
            },
          };

          return connectionState;
        };
      };

      return function (name) {
        return new ServerConnectionCore(name);
      };
    }
  );
