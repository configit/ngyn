( function( angular ) {
  'use strict';

  function trail( str, ch ) {
    return !str.match( new RegExp( ch + '$' ) ) ? str + ch : str;
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
  function encodeUriQuery( val, pctEncodeSpaces ) {
    return encodeURIComponent( val ).
      replace( /%40/gi, '@' ).
      replace( /%3A/gi, ':' ).
      replace( /%24/g, '$' ).
      replace( /%2C/gi, ',' ).
      replace(( pctEncodeSpaces ? null : /%20/g ), '+' );
  };

  function toKeyValue( obj ) {
    var parts = [];
    angular.forEach( obj, function( value, key ) {
      parts.push( encodeUriQuery( key, true ) + ( value === true ? '' : '=' + encodeUriQuery( value, true ) ) );
    } );
    return parts.length ? parts.join( '&' ) : '';
  };

  
  function values( o ) {
    return Object.keys( o ).map( function( key ) { return o[key] } );
  }

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
      routeContext.options.routeTransforms = angular.copy( this.options ? this.options.routeTransforms : [] );

      if ( options.routeTransform ) {
        routeContext.options.routeTransforms.push( options.routeTransform );
        delete options.routeTransform;
      }

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
      var orderedKeys = Object.keys( actions ).sort( function( a, b ) {
        // if the are the same return 0 to sort to indicate no change
        if ( actions[a] === actions[b] ) {
          return 0;
        }

        // if the second item is a collection it is ordered higher; return 1 to sort, otherwise -1
        return actions[b] === 'collection' ? 1 : -1;
      } );

      angular.forEach( orderedKeys, function( key ) {
        var action = objectifyAction( actions[key], key ),
        parentName = ( routeContext.scopeParent.options || { name: '' } ).name || '',
        aliasedParentName = angular.isDefined(( routeContext.scopeParent.options || {} ).urlAlias ) ?
          routeContext.scopeParent.options.urlAlias :
          ( routeContext.scopeParent.options || { name: '' } ).name || '',
        parentPath = ( path + parentName ) ? trail( path + parentName, '/' ) : '',
        aliasedParentPath = ( path + aliasedParentName ) ? trail( path + aliasedParentName, '/' ) : '',
        parentParam = !parentName ? '' : ( ':' + ( routeContext.scopeParent.options || { name: '' } ).name.replace( '-', '_' ) + '_id/' ),
        resourcePath = parentPath + resource.name + '/',
        resourceParam = ':' + resource.name.toLowerCase().replace( '-', '_' ) + '_id/',
        viewLocation = ( trail( routeProvider.appRoot, '/' ) + resourcePath + ( action.alias || action.key ) + '.html' ).toLowerCase(),
        routeWithoutKey = ( aliasedParentPath + parentParam + ( angular.isDefined( resource.urlAlias ) ? resource.urlAlias : resource.name ) + '/' ).replace( '//', '/' ).toLowerCase();

        if ( action.type === 'member' ) {
          routeWithoutKey += resourceParam;
        }

        var routePath = ( routePrefix + routeWithoutKey ).toLowerCase();

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

        if ( resource.routeTransforms.length ) {
          angular.forEach( resource.routeTransforms, function( transformer ) {
            transformer( routeProperties );
          } );
        }

        routeProvider.$routeProvider.when( routePath + action.key, routeProperties );

        if ( action.key === routeProvider.collectionDefaultAction || action.key === routeProvider.memberDefaultAction ) {
          routeProvider.$routeProvider.when( routePath, {
            controllerPath: controllerPath,
            path: routeProperties.path,
            routePath: routePath,
            redirectTo: ( routePath + action.key ).toLowerCase()
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
      scopeContext.options = angular.extend( {}, options, this.options );
      scopeContext.options.routeTransforms = angular.copy( this.options ? this.options.routeTransforms : [] );

      if ( options.routeTransform ) {
        scopeContext.options.routeTransforms.push( options.routeTransform );
        delete options.routeTransform;
      }

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

      options.routeTransforms = [];
      if ( options.routeTransform ) {
        options.routeTransforms.push( options.routeTransform );
        delete options.routeTransform;
      }

      routeContext.resource( options, scopedObject );
      return routeContext;
    };

    this.scope = function( options, scopedObject ) {

      var routeContext = new RouteContext( this );
      routeContext.options = angular.extend( {}, options, this.options );

      routeContext.options.routeTransforms = [];

      if ( options.routeTransform ) {
        routeContext.options.routeTransforms.push( options.routeTransform );
        delete options.routeTransform;
      }

      scopedObject.call( routeContext );
      return routeContext;
    };

    this.$get = function( $route, $routeParams, $location ) {

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

          //strip trailing and leading forward slashes
          if ( options.path ) {
            options.path = options.path.replace( new RegExp( '^\/+|\/+$', 'g' ), '' );
          }

          if ( $route.current ) {
            controller = ( options.controller || $route.current.controllerPath || '' ).toLowerCase();
            action = ( options.action || $route.current.action || '' ).toLowerCase();
            path = ( angular.isDefined( options.path ) ? options.path : $route.current.path || '' ).toLowerCase();
          } else {
            controller = ( options.controller || '' ).toLowerCase();
            action = ( options.action || '' ).toLowerCase();
            path = ( options.path || '' ).toLowerCase();
          }

          // non-resourceful routes will allow you to change the route params of the current route but no more
          if ( !options.controller && !options.action ) {
            intendedRoute = $route.current;
          }

          if ( !intendedRoute ) {
            if ( options.controller && !options.action ) { // we're just moving to a new controller and accepting the default action
              intendedRoute = values( $route.routes ).filter( function( r ) {
                return ( r.path || '' ).toLowerCase() === path &&
                   (r.controllerPath || '' ).toLowerCase() === controller &&
                  ( ( r.action || '' ).toLowerCase() === ( options[( r.name || '' ).toLowerCase() + "_id"] ? 'details' : 'index' ) );
              } )[0];
            } else {
              intendedRoute = values( $route.routes ).filter( function( r ) {
                return ( !$route.current || ( r.path || '' ).toLowerCase() === path ) &&
                ( r.controllerPath || '' ).toLowerCase() === controller &&
                ( r.action || '' ).toLowerCase() === action;
              } )[0];
            }
          }

          if ( !intendedRoute ) {
            return 'notfound?controller=' + controller + '&action=' + action;
          }

          // carry the search term over if the same route name
          search = $location.search();

          if ( Object.keys( search ).length && ( $route.current && intendedRoute.name === $route.current.name ) ) {
            if ( intendedRoute.action === 'index' ) {
              querystring = decodeURIComponent( search.back || '' );
            }
            else if ( search.back === undefined ) {
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
        action: function( action, options, persistSearch ) {
          return this.link( angular.extend( { action: action }, options, persistSearch ? $location.search() : {} ) );
        },
        gotoLink: function( options, persistSearch ) {
          $location.url( this.link( angular.extend( options, persistSearch ? $location.search() : {} ) ) );
        },
        gotoAction: function( action, options, persistSearch ) {
          $location.url( this.action( action, options, persistSearch ) );
        }
      };
    };
  };

  angular.module( 'ngynRoute', ['ngRoute'] ).config( function( $provide, $routeProvider ) {
    routeProvider.$routeProvider = $routeProvider;
    $provide.provider( 'ngynRoute', routeProvider );
  } );

} )( window.angular );
