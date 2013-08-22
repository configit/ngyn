/* VERSION: 0.1.0 */
( function( angular ) {
  'use strict';

  var trail = function( str, ch ) {
    return !str.match( new RegExp( ch + '$' ) ) ? str + ch : str;
  };

  var toKeyValue = function( obj ) {
    var parts = [];
    angular.forEach( obj, function( value, key ) {
      parts.push( encodeUriQuery( key, true ) + ( value === true ? '' : '=' + encodeUriQuery( value, true ) ) );
    } );
    return parts.length ? parts.join( '&' ) : '';
  };

  // This method is intended for encoding *key* or *value* parts of query component. We need a custom
  // method because encodeURIComponent is too agressive and encodes stuff that doesn't have to be
  // encoded per http://tools.ietf.org/html/rfc3986:
  //    query       =//( pchar / "/" / "?" )
  //    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
  //    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
  //    pct-encoded   = "%" HEXDIG HEXDIG
  //    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
  //                     / "*" / "+" / "," / ";" / "="
  var encodeUriQuery = function( val, pctEncodeSpaces ) {
    return encodeURIComponent( val ).
      replace( /%40/gi, '@' ).
      replace( /%3A/gi, ':' ).
      replace( /%24/g, '$' ).
      replace( /%2C/gi, ',' ).
      replace( ( pctEncodeSpaces ? null : /%20/g ), '+' );
  };

  var RouteContext = function( routeProvider ) {

    // Turns action key/value pair into object.
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
    var objectifyAction = function( action, key ) {
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

    this.resource = function( options, scopedObject ) {

      var routeContext = new RouteContext( routeProvider );
      routeContext.scopeParent = this;

      routeContext.options = angular.extend( {}, this.options, options );

      var resource = routeContext.options;
      var actions = resource.actions || routeProvider.defaultActions;

      var path = resource.path ? resource.path + '/' : '';
      var routePrefix = resource.routePrefix || '/';

      var ctx = routeContext;
      var controllerPath = '';
      while ( ctx.scopeParent ) {
        controllerPath = ctx.options.name + '/' + controllerPath;
        ctx = ctx.scopeParent;
      }
      controllerPath = controllerPath.replace( /\/$/, '' );

      // put collection actions first to ensure for example, that pr/new is not read as a details route (pr/:code).
      var orderedKeys = _.sortBy( _.keys( actions ), function( key ) { return actions[key] !== 'collection'; } );

      angular.forEach( orderedKeys, function( key ) {
        var action = objectifyAction( actions[key], key ),
        parentName = ( routeContext.scopeParent.options || { name: '' } ).name || '',
        aliasedParentName = angular.isDefined(( routeContext.scopeParent.options || {} ).urlAlias ) ?
          routeContext.scopeParent.options.urlAlias :
          ( routeContext.scopeParent.options || { name: '' } ).name || '',
        parentPath = ( path + parentName ) ? trail( path + parentName, '/' ) : '',
        aliasedParentPath = ( path + aliasedParentName ) ? trail( path + aliasedParentName, '/' ) : '',
        parentParam = !parentName ? '' : ( ':' + ( routeContext.scopeParent.options || { name: '' } ).name + '_id/' ),
        resourcePath = parentPath + resource.name + '/',
        resourceParam = ':' + angular.lowercase( resource.name ) + '_id/',
        viewLocation = angular.lowercase( trail( routeProvider.appRoot, '/' ) + resourcePath + ( action.alias || action.key ) + '.html' ),
        routeWithoutKey = angular.lowercase( aliasedParentPath + parentParam + ( angular.isDefined( resource.urlAlias ) ? resource.urlAlias : resource.name ) + '/' ).replace( '//', '/' );

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
          urlAlias: resource.urlAlias,
          routePrefix: routePrefix,
          routePath: routePath,
          isResource: true,
          viewScope: action.type || 'member',
          controllerPath: controllerPath
        };

        if ( resource.routeTransform ) {
          resource.routeTransform( routeProperties );
        }

        routeProvider.$routeProvider.when( routePath + action.key, routeProperties );

        if ( action.key === routeProvider.collectionDefaultAction || action.key === routeProvider.memberDefaultAction ) {
          routeProvider.$routeProvider.when( routePath, {
            controllerPath: controllerPath,
            path: routeProperties.path,
            routePath: routePath,
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

    this.scope = function( options, scopedObject ) {
      var scopeContext = new RouteContext( routeProvider );
      scopeContext.options = options;
      angular.extend( scopeContext.options, this.options );

      scopedObject.call( scopeContext );
      return scopeContext;
    };

  };

  var routeProvider = function() {
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

    this.resource = function( options, scopedObject ) {
      if ( angular.isString( options ) )
        options = { name: options };

      var routeContext = new RouteContext( this );
      routeContext.resource( options, scopedObject );
      return routeContext;
    };

    this.scope = function( options, scopedObject ) {
      var routeContext = new RouteContext( this );
      routeContext.options = angular.extend( {}, options, this.options );

      scopedObject.call( routeContext );
      return routeContext;
    };

    this.$get = ['$route', '$routeParams', '$location', function( $route, $routeParams, $location ) {

      return {
        link: function( options, additionalOptions ) {
          var params,
              unusedOptions,
              unusedOptionKeyValues = '',
              intendedRoute = null,
              querystring = '',
              search,
              action,
              path,
              controller;

          if ( angular.isString( options ) ) {
            var linkText = options;
            options = additionalOptions || {};
            if ( linkText.indexOf( '#' ) >= 0 ) {
              options.controller = linkText.substr( 0, linkText.indexOf( '#' ) );
              options.action = linkText.substr( linkText.indexOf( '#' ) + 1 );
            }
            else {
              options.controller = linkText;
            }
          }
          params = angular.extend( {}, $routeParams, options );
          unusedOptions = angular.copy( options );
          delete unusedOptions.controller;
          delete unusedOptions.action;
          delete unusedOptions.path;

          if ( $route.current ) {
            controller = angular.lowercase( options.controller || $route.current.controllerPath );
            action = angular.lowercase( options.action || $route.current.action );
            path = angular.lowercase( angular.isDefined( options.path ) ? options.path : $route.current.path || '' );
          } else {
            controller = angular.lowercase( options.controller );
            action = angular.lowercase( options.action );
            path = angular.lowercase( options.path );
          }

          // non-resourceful routes will allow you to change the route params of the current route but no more
          if ( !options.controller && !options.action ) {
            intendedRoute = $route.current;
          }

          if ( !intendedRoute ) {
            if ( options.controller && !options.action ) { // we're just moving to a new controller and accepting the default action
              intendedRoute = _.find( $route.routes, function( r ) {
                return angular.lowercase( r.path || '' ) === path &&
                  angular.lowercase( r.controllerPath ) === controller &&
                  ( angular.lowercase( r.action ) === ( options[angular.lowercase( r.name ) + "_id"] ? 'details' : 'index' ) );
              } );
            } else {
              intendedRoute = _.find( $route.routes, function( r ) {
                return ( !$route.current || angular.lowercase( r.path || '' ) === path ) &&
                angular.lowercase( r.controllerPath ) === controller &&
                angular.lowercase( r.action ) === action;
              } );
            }
          }

          if ( !intendedRoute ) {
            return 'notfound?controller=' + controller + '&action=' + action;
          }

          // carry the search term over if the same route name
          search = $location.search();

          if ( !_.isEmpty( search ) && ( $route.current && intendedRoute.name === $route.current.name ) ) {
            if ( intendedRoute.action === 'index' ) {
              querystring = decodeURIComponent( search.back || '' );
            }
            else if ( _.isUndefined( search.back ) ) {
              querystring = 'back=' + encodeUriQuery( toKeyValue( search ) );
            }
            else {
              querystring = toKeyValue( search );
            }
          }

          var resultPath = ( intendedRoute.routePath + ( intendedRoute.action || '' ) ).
            replace( /:([^\/]+)/ig, function( match, group1 ) {
              delete unusedOptions[group1];
              return params[group1];
            } );
          // remove trailing '/' to ensure hrefs works when running under a url prefix (e.g. http://localhost/MyApp/)
          resultPath = resultPath.replace( /^\/+/, '' );

          // append anything passed into the link function and not used to the querystring
          unusedOptionKeyValues = toKeyValue( unusedOptions );
          querystring += ( querystring.length && unusedOptionKeyValues.length ? '&' : '' ) + unusedOptionKeyValues;

          return resultPath + ( querystring.length ? '?' + querystring : '' );
        },
        action: function( action, options ) {
          return this.link( angular.extend( { action: action }, options ) );
        },
        gotoLink: function( options ) {
          $location.url( this.link( options ) );
        },
        gotoAction: function( action, options ) {
          $location.url( this.action( action, options ) );
        }
      };
    }];
  };

  angular.module( 'ngynRoute', [] ).config( ['$provide', '$routeProvider', function( $provide, $routeProvider ) {
    routeProvider.$routeProvider = $routeProvider;
    $provide.provider( 'ngynRoute', routeProvider );
  }] );

} )( window.angular );
