(function(angular) {

  angular.module('cs.modules')
  /*
  * Applies the jQuery-based select2 to the selected element 
  */
  .directive('select2', ['$parse', '$timeout', function($parse, $timeout) {
    return {
      require: ['ngModel', '?select'],
      restrict: 'A',

      compile: function (originalElement, originalAttrs) {
        var placeholderText,
        placeholderOption = originalElement.find('option[value=""]');

        if (placeholderOption.length>0) {
          placeholderText = placeholderOption.text();
          placeholderOption.text('');
        }

        return function link(scope, elm, attrs, controllers) {
          var ngModelController = controllers[0];
          var selectController = controllers[1];
          var key = attrs.keyPath || 'id';
          var display = attrs.displayPath || 'text';
          var keyParser = $parse(key);
          var displayParser = $parse(display);
          var initCallback;

          var parseResult = function(originalvalues) {
            if (!originalvalues) {
              return originalvalues;
            }

            values = angular.isArray(originalvalues) ? originalvalues : [originalvalues];

            var results = [];
            angular.forEach(values, function(r) {
              results.push( {
                id: keyParser(r),
                text: displayParser(r)
              });
            });
            return angular.isArray(originalvalues) ? results : results[0];
          }

          if (!elm.is('select')) {

            /* Problem 3 */
            ngModelController.$parsers.push( function(newVal) {
              return elm.select2('data');
            });
            /* Problem 4 */
            ngModelController.$formatters.push( function(newval) {
              elm.select2('data', parseResult(newval));
              return newval;
            });

            /* Problem 2 */
            elm.on('change', function(e) {
              scope.$apply(function() {
                ngModelController.$setViewValue(e.val);
              });
            });
          } else { //elm is select
          /* Problem 1 */
          ngModelController.$formatters.push( function() {
            $timeout(function() {
              elm.select2('val', elm.val());
            });
          });
        }

        // initialize the select2
        var options = {
          allowClear:true
        };

        if (placeholderText) {
          options.placeholder = placeholderText;
        }

        if (elm.is('input')) {
          options.multiple = angular.isDefined(attrs.multiple);        
        }

        angular.extend(options, scope.$eval(attrs.select2));

        $timeout(function() {
          elm.select2(options);
          if (!elm.is('select')) {
            elm.select2('data', parseResult(ngModelController.$modelValue));
          }
        });
      }
    }
  }
}]);

})(window.angular);