/* VERSION: 0.1.0 */
angular.module( 'ngyn-ui-multi-picker', [] )
  .directive('ngynMultiPicker', function($compile, $timeout) {
    setInitialStyles();

    function dasherize(str) {
      return str.replace(/([A-Z])/g, function(v) { return '-' + angular.lowercase(v) } );
    }
    function capitalize(str) {
      return str.replace(/^([a-z])/, function(v) { return angular.uppercase(v) } );
    }

    function offset( elem ) {
      var offset = {top:0,left:0};
      do {
        angular.forEach(['top', 'left'], function(dimension) {
          var dimensionValue = elem['offset'+ capitalize(dimension)];
          if ( !isNaN( dimensionValue ) ) {
            offset[dimension] += dimensionValue;
          }
        });
      } while( elem = elem.offsetParent );
      return offset;
    }

    function setInitialStyles() {
      // create an initial input element and hide it to get the props from
      var i = document.createElement('input');
      i.style.position = 'absolute';
      i.style.visibility = 'hidden';
      document.documentElement.appendChild(i);
      var iStyles = window.getComputedStyle(i);
      // IE must read a property twice, the first is the default, the second is the real value. Awesome.
      var discardedWidth = iStyles.width;

      var propKeys = ['width', 'height', 
        'marginLeft', 'marginRight', 'marginTop', 'marginBottom',
        'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
        'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth',
        'fontFamily', 'fontSize', 'lineHeight' ]

        // it's impossible to get the same style that a firefox input has from computed styles
        // the border it gives us is nearly white so we ignore it
        var firefox = navigator.userAgent.indexOf('Firefox') >= 0;
        if (!firefox) {
          angular.forEach( [ 'borderBottomColor', 'borderTopColor', 'borderRightColor', 'borderLeftColor' ], function(propKey) {
            propKeys.push(propKey);
          } )
        }

      var classText = ".ngyn-picker { "+ 
        "border-style: solid; "+ 
        "border-color: #BBBBBB; "+
        "display: inline-block; "+ 
        "vertical-align: top; "+
        "-moz-appearance:textfield; "+
        "-webkit-appearance: textfield;";
      angular.forEach(propKeys, function(propKey) {
        var fromKey = propKey == 'height' ? 'min-height' : propKey;
        classText += dasherize(fromKey) + ":" + iStyles[propKey] + ';';
      });
      classText += "}";

      var styleTag = document.createElement('style');
      styleTag.type = 'text/css';
      styleTag.innerHTML = classText;
      document.getElementsByTagName('head')[0].appendChild( styleTag )
      
      document.documentElement.removeChild(i);
    }

    var containerTemplateString = '<span class="ngyn-picker">' +
                '  <span class="ngyn-picker-selection">' +
                '    <span class="ngyn-picker-remove-selection">&times;</span>' +
                '  </span>' +
                '  <span class="ngyn-picker-placeholder" ' +
                '    ng-show="!showInput" contenteditable >' +
                'Add...'+
                '  </span>' +
                '  <span class="ngyn-picker-add-selection" '+ 
                '   ng-show="showInput" contenteditable >' +
                '  </span>' +
                '</span>';
    var menuTemplateString = '<div style="display:none" class="ngyn-picker-options">' +
                '  <div class="ngyn-picker-option"></div>' + 
                '</div>'


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

        var containerElement = angular.element( containerTemplateString );
        var selection = containerElement.children().eq( 0 );
        var placeholder = containerElement.children().eq( 1 );
        var input = containerElement.children().eq( 2 );
        selection.attr( 'ng-repeat', repeatableElement + ' in ' + cattrs.ngModel );
        selection.prepend( selectionTemplate.html() );

        var menuElement = angular.element( menuTemplateString );
        var option = menuElement.children().eq(0);
        option.attr( 'ng-repeat', repeatableElement + ' in ' + repeatableCollection)
        optionTemplate.attr( 'ng-click', 'addSelection('+ repeatableElement +')' );
        option.prepend( optionTemplate );

        celm.replaceWith();
        celm.append(containerElement);
        celm.append(menuElement);

        function reposition() {
          menuElement[0].style.left = containerElement[0].offsetLeft + 'px';
          menuElement[0].style.top = (containerElement[0].offsetTop + containerElement[0].offsetHeight ) + 'px';
        }

        return function link( scope, elm, attrs, model ) {
          scope.showInput = false;

          scope.addSelection = function(s) {
            scope.$eval(cattrs.ngModel).push(s);
            $timeout(reposition);
          }

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
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents( input[0] );
            selection.removeAllRanges();
            selection.addRange(range);
          } );
        });

        input.bind('keydown', function(ev) {
          if (ev.keyCode == 13) {
            ev.preventDefault();
          }
        });


        /* needs to be replaced by more inteligent 'control lost focus' logic
        input.bind('blur', function() {
          menuElement[0].style.display = 'none';

          scope.$apply( function() {
            input.html( '' );
            scope.showInput = false;
          } );
        });
        */

        }
      }
    }
  });