(function( angular ) {
  'use strict';

  angular.module( 'ngyn-ui-multi-picker', ['ngyn-web-resources'] ).directive('ngynMultiPicker', function($compile, $timeout, $document, $window, WebResources) {

    WebResources.attachCss('src/ui-multi-picker/ui-multi-picker-styles.css');
    setInitialStyles();

    function dasherize(str) {
      return str.replace(/([A-Z])/g, function(v) { return '-' + angular.lowercase(v); } );
    }
    function capitalize(str) {
      return str.replace(/^([a-z])/, function(v) { return angular.uppercase(v); } );
    }

    function offset( elem ) {
      /*jshint loopfunc: true */
      var totalOffset = { top:0, left:0 };
      do {
        angular.forEach(['top', 'left'], function(dimension) {
          var dimensionValue = elem['offset'+ capitalize(dimension)];
          if ( !isNaN( dimensionValue ) ) {
            totalOffset[dimension] += dimensionValue;
          }
        } );
      } while( elem = elem.offsetParent );
      /*jshint loopfunc: false */
      return totalOffset;
    }

    function setInitialStyles() {
      // create an initial input element and hide it to get the props from
      var i = $document[0].createElement('input');
      i.style.position = 'absolute';
      i.style.visibility = 'hidden';
      $document[0].documentElement.appendChild(i);
      var iStyles = $window.getComputedStyle(i);
      // IE must read a property twice, the first is the default, the second is the real value. Awesome.
      iStyles.width || undefined;

      var propKeys = ['width', 'height',
        'marginLeft', 'marginRight', 'marginTop', 'marginBottom',
        'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
        'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth',
        'fontFamily', 'fontSize', 'lineHeight' ];

      // it's impossible to get the same style that a firefox input has from computed styles
      // the border it gives us is nearly white so we ignore it
      var firefox = navigator.userAgent.indexOf('Firefox') >= 0;
      if (!firefox) {
        angular.forEach( [ 'borderBottomColor', 'borderTopColor', 'borderRightColor', 'borderLeftColor' ], function(propKey) {
          propKeys.push(propKey);
        } );
      }

      var classText = ".ngyn-picker { ";
      angular.forEach(propKeys, function(propKey) {
        var fromKey = propKey === 'height' ? 'min-height' : propKey;
        classText += dasherize(fromKey) + ":" + iStyles[propKey] + ';';
      });
      classText += "}";

      var styleTag = $document[0].createElement('style');
      styleTag.type = 'text/css';
      styleTag.innerHTML = classText;
      $document[0].getElementsByTagName('head')[0].appendChild( styleTag );

      $document[0].documentElement.removeChild(i);
    }

    var containerTemplateString = WebResources.files['src/ui-multi-picker/container-template.html'];
    var menuTemplateString = WebResources.files['src/ui-multi-picker/menu-template.html'];

    return {
      restrict: 'E',
      require: 'ngModel',
      replace: true,
      scope: true,
      compile: function(celm, cattrs, transclude) {

        var match = cattrs.options.match(/([^\W]*) in ([^$]*)/);
        var repeatableElement = match[1];
        var repeatableCollection = match[2];
        var selectionTemplate = celm.find('picker-selection');
        var optionTemplate = celm.find('picker-option');

        var htmlElement = angular.element( $document ).find( 'html' );
        var containerElement = angular.element( containerTemplateString );
        var selection = containerElement.children().eq( 0 );
        var placeholder = containerElement.children().eq( 1 );
        var input = containerElement.children().eq( 2 );
        input.bind( 'keyup', inputTextChanged );
        input.bind( 'keydown', inputTextChanging );
        
        selection.attr( 'ng-repeat', repeatableElement + ' in ' + cattrs.ngModel );
        var removeButton = selection.children().eq(0);
        removeButton.attr( 'ng-click', 'removeSelection( ' + repeatableElement + ' ) ' );
        selection.prepend( selectionTemplate.html() );

        var menuElement = angular.element( menuTemplateString );
        var option = menuElement.children().eq(0);
        option.attr( 'ng-repeat', repeatableElement + ' in reducedOptions || availableCollectionElements' );
        optionTemplate.attr( 'ng-click', 'addSelection( ' + repeatableElement + ' ) ' );
        option.prepend( optionTemplate );

        celm.replaceWith();
        celm.append(containerElement);
        celm.append(menuElement);

        function reposition() {
          menuElement[0].style.left = containerElement[0].offsetLeft + 'px';
          menuElement[0].style.top = (containerElement[0].offsetTop + containerElement[0].offsetHeight ) + 'px';
        }

        function inputTextChanging( ev ) {
          if (ev.keyCode === 38 || ev.keyCode === 40 || ev.keyCode === 13) {
            // cancel default behavior of up and down keys which moves caret to start and end
            ev.preventDefault();
          }
          //var scope = angular.element( ev.target ).scope();
          if (ev.keyCode === 9) {
            // hide menu when user presses tab
          }

        }

        function inputTextChanged ( ev ) {
          var scope = angular.element( ev.target ).scope();
          var c = scope.reducedOptions || scope.availableCollectionElements;
          var val = ev.target.innerHTML;

          scope.$apply(function() {
            if (ev.keyCode === 38 && scope.selectedOptionIndex > -1 ) {
              scope.selectedOptionIndex -= 1;
              return;
            }
            if (ev.keyCode === 40 && scope.selectedOptionIndex < c.length-1 ) {
              scope.selectedOptionIndex += 1;
              return;
            }

            if (ev.keyCode === 13 && scope.selectedOptionIndex > -1) {

              scope.addSelection(c[scope.selectedOptionIndex]);
              if (scope.selectedOptionIndex === c.length-1) {
                scope.selectedOptionIndex -= 1;
              }
              //scope.$apply();
              // needed to cause the watch on model to retrigger
              // but causes error in digest cycle
            }

            if (ev.keyCode === 8 && scope.availableCollectionElements.length && val.length === 0) {
              var modelItems = scope.$eval(cattrs.ngModel);
              scope.removeSelection( modelItems[modelItems.length-1] );
            }

            if ( !val ) {
              scope.reducedOptions = null;
              return;
            }
            scope.reducedOptions = [];

            var findProperty = function( prop ) {
              if ( found ) {
                return;
              }
              if ( typeof(prop) === 'string' && prop[0] !== '$' && prop.search( new RegExp(val, 'i') ) >= 0 ) {
                found = true;
              }
            };

            for (var i = 0; i < scope.availableCollectionElements.length; i++) {
              var found = false;
              angular.forEach( scope.availableCollectionElements[i], findProperty );
              if (found) {
                scope.reducedOptions.push( scope.availableCollectionElements[i] );
              }
            }
          } );
        }

        return function link( scope, elm, attrs, model ) {

          scope.showInput = false;
          scope.selectedOptionIndex = -1;
          var originalCollection = scope.$eval ( repeatableCollection );
          scope.availableCollectionElements = [];
          
          scope.$parent.$watch( cattrs.ngModel, function( modelItems, oldModelItems ) {
            scope.availableCollectionElements.length = 0;
            for ( var x = 0; x < originalCollection.length; x++ ) {
              var selected = false;
              for (var i = 0; i < modelItems.length; i++) {
                if ( modelItems[i] === originalCollection[x] ) {
                  selected = true;
                  break;
                }
              }
              if (!selected) {
                scope.availableCollectionElements.push(originalCollection[x]);
              }
            }
          }, true);

          scope.addSelection = function(s) {
            scope.$eval(cattrs.ngModel).push(s);
            scope.reducedOptions = null;
            $timeout(function() {
              if (scope.availableCollectionElements.length) {
                placeholder.triggerHandler('focus');
              }
              reposition();
            } );
          };

          scope.removeSelection = function(s) {
            var modelItems = scope.$eval(cattrs.ngModel);
            for (var x = 0; x < modelItems.length; x++) {
              if (modelItems[x] === s) {
                modelItems.splice(x, 1);
                $timeout(reposition);
                break;
              }
            }
          };

          scope.focusAddSelection = function() {
            if (!scope.availableCollectionElements.length)
              return;

            $timeout(function(){
              placeholder.triggerHandler('focus');
            });
          };

          containerElement.bind('click', function(ev) {
            // Stop event bubbling up to html in order to stop it being closed
            ev.stopPropagation();
          });

          placeholder.bind('focus', function() {
            menuElement[0].style.display = 'block';
            reposition();
            scope.$apply( function() {
              scope.showInput = true;
              // browsers won't focus something that's hidden
              // and the rest of the code occurs before binding has happened
              // and made input visible. Therefore we force it visible immediately.
              input[0].style.display = 'inline-block';
              input[0].focus();
            } );
          });

          scope.hideMenu = function() {
            // Remove menu when any element is clicked
            // Note: the element itself has a click handler which catches
            // the event so it doesn't closed when itself it clicked
            menuElement[0].style.display = 'none';

            scope.$apply( function() {
              input.html( '' );
              scope.showInput = false;
            } );
          };

          htmlElement.bind('click', scope.hideMenu);
        };
      }
    };
  });
})( window.angular);
