(function(angular) {

  angular.module('cs.modules')
  .directive('select', ['$parse', function($parse) {
    return {
      restrict: 'E',
      require: ['?ngModel', '?select'],
      link: function(scope, elm, attrs, controllers) {
        var ngModelController = controllers[0];
        var selectController = controllers[1];
        if (!attrs.key || !selectController) {
          return;
        }

        /* 
        * Unfortunately the selectController doesn't expose the collection it is bound to,
        * so we have to emulate the steps it takes to get at the collection
        */
        var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/
        var optionsExp = attrs.ngOptions;
        var match = optionsExp.match(NG_OPTIONS_REGEXP);
        var valuesFn = $parse(match[7]);
        var collection = valuesFn(scope);
        var key = attrs.key;
        /*
        * We push on a formatter to retrieve the related element(s) (based on key) 
        * and use that in place of the supplied object
        */
        ngModelController.$formatters.push(function(val) {
          var getter = $parse(key);
          var mappedVals = [];
          angular.forEach(collection, function(v) {
            angular.forEach(angular.isArray(val) ? val : [val], function(v2){
              if (getter(v) === getter(v2)) {
                //console.log('mapped', v2, 'to', v, 'based on', key );
                mappedVals.push(v);
              }
            });
          });
          if (mappedVals.length>0) {
            ngModelController.$modelValue = angular.isArray(val) ? mappedVals : mappedVals[0];
          }
          return val;
        });
      }
    }
  }]);

})(window.angular);