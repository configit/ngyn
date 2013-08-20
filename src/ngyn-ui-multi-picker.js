angular.module( 'ngyn-ui-multi-picker', [] )
  .directive('ngynMultiPicker', function($compile) {
    setInitialStyles();

    function dasherize(str) {
      return str.replace(/([A-Z])/g, function(v) { return '-' + angular.lowercase(v) } );
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

    var myTemplate = '<span class="ngyn-picker">' +
                '  <span class="ngyn-picker-selection">' +
                '    <span class="ngyn-picker-remove-selection">&times;</span>' +
                '  </span>' +
                '  <span' +
                '    class="ngyn-picker-add-selection ngyn-picker-placeholder"' +
                '    contenteditable ' +
                '    > ' +
                '    Add... '+
                '  </span>' +
                '</span>';

    return {
      restrict: 'E',
      require: 'ngModel',
      replace: true,
      compile: function(celm, cattrs, transclude) {
        var match = cattrs.options.match(/([^\W]*) in ([^$]*)/);
        var repeatableElement = match[1];
        var repeatableCollection = match[2];
        var selectionTemplate = celm.find('picker-selection');
        var optionTemplate = celm.find('picker-option');

        var template = angular.element( myTemplate );
        var selection = template.children().eq( 0 );
        selection.attr( 'ng-repeat', repeatableElement + ' in ' + repeatableCollection );
        selection.prepend( selectionTemplate );

        celm.replaceWith( template );

        return function link( scope, elm, attrs, model ) {
        }
      }
    }
  });