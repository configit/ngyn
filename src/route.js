( function ( window, angular, undefined ) {
  'use strict';

  var trail = function( str, ch ) {
    return !str.match( new RegExp( ch + '$' ) ) ? str + ch : str;
  };

  var RouteContext = function ( routeProvider ) {

    // Turns action object.
    //
    // Examples:
    //
    // objectifyAction( 'member', 'details' )
    // returns  { type: 'member', key : 'details' }
    //
    // objectifyAction( 'member', 'details' )
    // returns { type: 'member', key : 'details' };
    //
    // objectifyAction( 'member', 'details:edit' )
    // returns { type: 'member', key : 'details', alias:'edit' };
    //
    // objectifyAction( { type: 'member', alias:'edit'}, 'details' )
    // returns { type: 'member', alias:'edit', key : 'details' };
    var objectifyAction = function ( action, key ) {
      var actionObj = {},
      keyalias = key.split( ':' );

      // if alias is encoded in key add it to obj and change key
      if ( keyalias.length >= 2 ) {
        key = keyalias[0];
        actionObj.alias = keyalias[1];
      }

      // add string actions as type
      if ( angular.isString( action ) ) {
        actionObj.type = action;
      }

      // extend actionObj with object actions
      if ( angular.isObject( action ) ) {
        actionObj = angular.extend( actionObj, action );
      }
      // add key and return
      return angular.extend( actionObj, { key: key } );
    };

    this.resource = function ( options, scopedObject ) {

      var routeContext = new RouteContext( routeProvider );
      routeContext.scopeParent = this;

      routeContext.options = angular.extend( {}, this.options, options );

      var resource = routeContext.options;
      var actions = resource.actions || routeProvider.defaultActions;

      var scope = resource.scope ? resource.scope + '/' : '';
      var routePrefix = resource.routePrefix || '/';

      // put collection actions first to ensure for example, that pr/new is not read as a details route (pr/:code).
      var orderedKeys = _.sortBy( _.keys( actions ), function( key ) { return actions[key] !== 'collection'; } );

      angular.forEach( orderedKeys, function ( key ) {
        var action = objectifyAction( actions[key], key ),
        parentName = (routeContext.scopeParent.options || {name:''}).name || '',
        aliasedParentName = angular.isDefined((routeContext.scopeParent.options || {}).path)
                     ? routeContext.scopeParent.options.path : (routeContext.scopeParent.options || {name:''}).name || '',
        parentPath = ( scope + parentName ) ? trail( scope + parentName, '/' ) : '',
        aliasedParentPath = ( scope + aliasedParentName ) ? trail( scope + aliasedParentName, '/' ) : '',
        parentParam = !parentName ? '' : (':' + (routeContext.scopeParent.options || {name:''}).name + '_id/'),
        resourcePath = parentPath + resource.name + '/',
        resourceParam = ':' + angular.lowercase( resource.name ) + '_id/',
        viewLocation = angular.lowercase( routeProvider.appRoot + resourcePath + (action.alias || action.key) + '.html' ),
        routeWithoutKey = angular.lowercase( aliasedParentPath + parentParam + (angular.isDefined(resource.path) ? resource.path : resource.name) + '/' ).replace('//', '/');

        if ( action.type === 'member' ) {
          routeWithoutKey += resourceParam;
        }

        var routePath = angular.lowercase( routePrefix + routeWithoutKey );

        var routeProperties = {
          name: resource.name,
          templateUrl: viewLocation,
          reloadOnSearch: angular.isDefined( resource.reloadOnSearch ) ? resource.reloadOnSearch : true,
          layoutUrl: resource.layoutUrl,
          action: action.key,
          path: resource.path || '',
          routePrefix: routePrefix,
          routePath: routePath,
          isResource: true,
          viewScope: action.type || 'member'
        };

        if ( resource.routeTransform ) {
          resource.routeTransform( routeProperties );
        }

        routeProvider.$routeProvider.when( routePath + action.key, routeProperties );

        if ( action.key === routeProvider.collectionDefaultAction || action.key === routeProvider.memberDefaultAction ) {
          routeProvider.$routeProvider.when( routePath, {
            redirectTo: angular.lowercase( routePath + action.key )
          } );
        }
      } );

      //reset the parent scope's options to ignore any actions defined on this resource
      if ( options && options.actions ) {
        if ( this.options && this.options.actions ) {
          routeContext.options.actions = this.options.actions;
        } else {
          routeContext.options.actions = routeProvider.defaultActions;
        }
      }

      if ( scopedObject ) {
        scopedObject.call( routeContext );
      }

      return routeContext;
    };

    this.scope = function ( options, scopedObject ) {
      var scopeContext = new RouteContext( routeProvider );
      scopeContext.options = options;
      angular.extend( scopeContext.options, this.options );

      scopedObject.call( scopeContext );
      return scopeContext;
    };

  };

  var routeProvider = function () {
    // -- config

    this.$routeProvider = routeProvider.$routeProvider;
    this.appRoot = 'client/app/';
    this.defaultActions = {
      'index': 'collection',
      'new': 'collection',
      'edit': 'member',
      'details': 'member'
    };
    this.collectionDefaultAction = 'index';
    this.memberDefaultAction = 'details';

    // -- end config

    this.resource = function ( options, scopedObject ) {
      if (angular.isString(options)) 
        options = { name: options };
      
      var routeContext = new RouteContext( this );
      routeContext.resource( options, scopedObject );
      return routeContext;
    };

    this.scope = function ( options, scopedObject ) {
      var routeContext = new RouteContext( this );
      routeContext.options = angular.extend( {}, options, this.options );

      scopedObject.call( routeContext );
      return routeContext;
    };

    this.$get = ['$route', '$routeParams', '$location', function ( $route, $routeParams, $location ) {

      return {
        link: function ( options ) {
          var params = angular.extend( { }, $routeParams, options ),
          intendedRoute = null,
          searchTerm = '',
          search;

          if ( !options.action ) {
            intendedRoute = $route.current;
          } else if ( $route.current && angular.isDefined( $route.current.path ) ) {
            intendedRoute = _.find( $route.routes, function ( r ) {
              return angular.isDefined( r.path ) &&
              angular.lowercase( r.path ) === angular.lowercase( $route.current.path ) &&
              r.routePrefix === $route.current.routePrefix &&
              r.name === $route.current.name &&
              r.action === ( options.action || $route.current.action );
            } );
          }

          if ( !intendedRoute ) {
            return 'notfound?action=' + options.action;
          }
          // carry the search term over if the same route name
          search = $location.search();
          if ( !_.isEmpty( search ) && ( intendedRoute.name === $route.current.$route.name ) ) {
            if ( intendedRoute.action === 'index' ) {
              searchTerm = decodeURIComponent( search.back || '' );
            }
            else if ( _.isUndefined( search.back ) ) {
              searchTerm = 'back=' + _.encodeUriQuery( _.toKeyValue( search ) );
            }
            else {
              searchTerm = _.toKeyValue( search );
            }
          }
          var path = ( intendedRoute.routePath + ( intendedRoute.action || '' ) ).
          replace( /:([^\/]+)/ig, function ( match, group1 ) { return params[group1]; } );
          // remove trailing '/' to ensure hrefs works when running under a url prefix (http://localhost/Ace/)
          path = path.replace(/^\/+/, '');

          return path + ( searchTerm ? '?' + searchTerm : '' );
        },
        action: function ( action ) {
          return this.link( { action: action } );
        },
        gotoLink: function ( options ) {
          $location.url( this.link( options ) );
        },
        gotoAction: function ( action ) {
          $location.url( this.action( action ) );
        }
      };
    }];
  };

  angular.module( 'cs.modules' ).config( ['$provide', '$routeProvider', function ( $provide, $routeProvider ) {
    routeProvider.$routeProvider = $routeProvider;
    $provide.provider( 'route', routeProvider );
  } ] );

} )( window, window.angular );
