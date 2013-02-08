!function (angular) {
  'use strict';
  
  angular.module( 'cs.modules.config', [] ).value('cs.modules.config', {} );
  angular.module( 'cs.modules', ['cs.modules.config'] );

}(window.angular);