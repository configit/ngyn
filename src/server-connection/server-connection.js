angular.module( 'ngynServerConnection' )
  /**
   * A factory which creates a ServerConnection object that lets you interact with a realtime
   * server connection technology such as SignalR; this underlying technology is expected to be
   * dependency injected as the ServerConnectionBackend service.
   *
   * The primary purpose of ServerConnection is to provide automatic connection management, automatically 
   * starting the underlying connection when the first provider requests it and stopping it when all are no
   * longer requesting it.
   *
   * The secondary purpose is automatic disposal of instance connections.
   * Each connection registration is tied to a scope, once the scope is destroyed the connection request 
   * is popped off the stack and the connection may be closed as described above.
   * 
   * Usage: 
   *    var myhub = new ServerConnection('MyHub');
   *    myHub.connect( scope, { onMyEvent: function( e ) { console.log( e ) } } )
   */
  .factory( 'ServerConnection', ["ServerConnectionBackend", "$log", "$timeout", function( ServerConnectionBackend, $log, $timeout ) {
    var reconnectTimeout = 5000; // amount of time to wait between losing the connection and reconnecting
    var openConnections = [];
    var connectionOpen = false;
    var doneHandlers = [];

    function log( message ) {
      if ( ServerConnectionBackend.logging() ) {
        $log.info( message );
      };
    }

    /**
     * Creates a new ServerConnection tied to the hub specified by the name parameter
     * @constructor
     */
    var ServerConnection = function( name ) {
      var self = this;
      var allListeners = {};
      this.responseInterceptors = [];

      /**
       * Deregisters the intended connection for this instance.
       * If it is the last, it closes the underlying connection.
       */
      function stopListening( scope ) {
        var isLastScopeListening = ( openConnections.length === 1 );
        for ( var i = 0; i < openConnections.length; i++ ) {
          if ( openConnections[i].scope === scope ) {
            openConnections.splice( i, 1 );
            break;
          }
        };

        if ( isLastScopeListening ) {
          log( '[ServerConnection] all listeners unregistered, closing SignalR connection' );
          ServerConnectionBackend.stop();
          connectionOpen = false;
        }
      };

      /**
       * Rewrites response based on the registered response interceptors
       */
      function applyResponseInterceptors( hubName, methodName, args ) {
        var newArgs = args;
        angular.forEach( self.responseInterceptors, function( ri ) {
          newArgs = ri( hubName, methodName, newArgs );
        } );

        return newArgs;
      }

      /**
       * Returns a proxy object that wraps the server object
       * to allow rewriting of the response
       */
      function createServerProxy( hubName, server ) {
        var proxy = {};

        function _addCallback( callbackArray, callback ) {
          if ( !angular.isUndefined( callback ) ) {
            callbackArray.push( callback );
          }
        };

        if ( !server ) {
          return proxy;
        }

        angular.forEach( Object.keys( server ), function( fnName ) {
          proxy[fnName] = function() {
            var promise = {
              _callbacks: {
                done: [], fail: [], progress: []
              },
              then: function( fnDone, fnFail, fnProgress ) {
                _addCallback( this._callbacks.done, fnDone );
                _addCallback( this._callbacks.fail, fnFail );
                _addCallback( this._callbacks.progress, fnProgress );
                return this;
              },
              always: function( fnAlways ) {
                this.then( fnAlways, fnAlways );
                return this;
              },
              done: function( fnDone ) {
                this.then( fnDone );
                return this;
              },
              fail: function( fnFail ) {
                this.then( undefined, fnFail );
                return this;
              },
              progress: function( fnProgress ) {
                this.then( undefined, undefined, fnProgress );
                return this;
              }
            };

            var serverPromise = server[fnName].apply( server, arguments );

            function createResponseInterceptorWrapper( callbacks ) {
              return function() {
                var promiseArgs = applyResponseInterceptors( hubName, fnName, arguments );

                angular.forEach( callbacks, function( handler ) {
                  handler.apply( handler, promiseArgs );
                } );
              };
            }

            serverPromise
              .then(
                createResponseInterceptorWrapper( promise._callbacks.done ),
                createResponseInterceptorWrapper( promise._callbacks.fail ),
                createResponseInterceptorWrapper( promise._callbacks.progress )
              );

            return promise;
          };
        } );

        return proxy;
      }

      /**
       * Creates the server property on the instance and fires all done handlers.
       * When this is the first connection it is triggered when the underlying connection completes.
       * If the connection is already open it is triggered immediately.
       */
      function completeConnection() {
        angular.forEach( doneHandlers, function( handler ) {
          /*
            At the point of connection completion we could be in any hub, each doneHandler therefore
            has a hub property which relates back to the original hub which requested it.
            We set the server property on that hub so clients can now talk to the server
          */
          var serverProxy = createServerProxy( handler.hubName, ServerConnectionBackend.server( handler.hubName ) );
          handler.hub.server = serverProxy;
          handler.doneFn();
        } );
        doneHandlers.length = 0;
      };

      /**
       * Automatically reconnect when the backend disconnects whilst an open connection is still required
       */
      ServerConnectionBackend.onDisconnect( function() {
        if ( openConnections.length < 1 ) {
          // The connection is no longer required so don't bother reconnecting
          return;
        }

        log( '[ServerConnection] Received disconnected message whilst a connection is still required. Reconnecting in ' +
          reconnectTimeout + "ms" );

        $timeout(
          function() {
            connectionOpen = false;
            ServerConnectionBackend.start().done( function() {
              connectionOpen = true;
            } );
          },
          reconnectTimeout,
          false // do not invoke apply
        );
      } );

      /**
       * Registers an intended connection for this instance.
       * If it is the first it opens the underlying connection.
       * @param {object} scope - The angular scope to tied this connection registration to
       * @param {object} [listeners] - A key/value pair where key is the name of the method to subscribe to and value is the function to call when triggered
       */
      self.connect = function( scope, listeners ) {
        listeners = listeners || {};
        self.server = {};
        var server = ServerConnectionBackend.server( name );
        if ( server ) {
          angular.forEach( Object.keys( server ), function( fnName ) {
            self.server[fnName] = function() {
              throw Error( "Cannot call the " + fnName + " function on the " + name + " hub because the server connection is not established. Place your server calls within the connect(...).done() block" );
            };
          } );
        }

        angular.forEach( Object.keys( listeners ), function( listenerKey ) {
          if ( !allListeners[listenerKey] ) {
            allListeners[listenerKey] = [];
          }

          log( '[ServerConnection] pushing on listener for ' + name + '.' + listenerKey );

          // if the function wrapper is not already there, push it on
          if ( allListeners[listenerKey].length === 0 ) {
            ServerConnectionBackend.on( name, listenerKey, function() {
              var args = applyResponseInterceptors( name, listenerKey, arguments );
              angular.forEach( allListeners[listenerKey], function( scopeListener ) {
                scopeListener.listener.apply( this, args );
              } );
            } );
          }

          allListeners[listenerKey].push( { scope: scope, listener: listeners[listenerKey] } );
        } );
        var doneHandler = { scope: scope, doneFn: angular.noop, hubName: name, hub: self };
        doneHandlers.push( doneHandler );

        var connectionState = {
          done: function( doneFn ) {
            // modify original (empty) done handler as one has been explicitly specified
            doneHandler.doneFn = doneFn;
          }
        };

        if ( openConnections.length === 0 ) {
          log( '[ServerConnection] listeners registered, opening SignalR connection' );
          ServerConnectionBackend.start().done( function() {
            connectionOpen = true;
            $timeout( completeConnection, 0 );
          } );
        }

        openConnections.push( { scope: scope, doneFns: [] } );

        /**
         * When the scope to which this connection is tied to is destroyed, we deregister the connection
         * and remove any methods subscribed to at connection time. If there are no longer any methods across
         * all hubs listening to this event we remove the underlying connection's event hook.
         */
        var onDestroy = function() {
          stopListening( scope );

          angular.forEach( Object.keys( allListeners ), function( methodKey ) {
            var hubMethods = allListeners[methodKey];
            for ( var j = hubMethods.length - 1; j >= 0; j-- ) {
              if ( hubMethods[j].scope === scope ) {
                hubMethods.splice( j, 1 );
              }
            }
            if ( hubMethods.length === 0 ) {
              ServerConnectionBackend.off( name, methodKey );
            }
          } );
        };

        scope.$on( '$destroy', onDestroy );

        if ( connectionOpen ) {
          $timeout( completeConnection, 0 );
          return connectionState;
        }

        return connectionState;
      };
    };

    return function( name ) {
      var Instance = function() { };
      Instance.prototype = new ServerConnection( name );
      return new Instance();
    };
  }] );