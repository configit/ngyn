angular.module('app', ['ngynSelectKey']).controller('TestController', function($scope) {
  $scope.roles = [
    {id: 1, name: 'Admin'},
    {id: 2, name: 'Editor'},
    {id: 3, name: 'Reviewer'}
    ];

  $scope.user = { name: 'Misko Hevery', role: {id:2, name: 'Editor'} };
  $scope.advancedUser = { name: 'Igor Minar', roles: [
    {id:1, name: 'Admin', undefined_key_value: undefined },
    {id:3, name:'Reviewer', undefined_key_value: undefined }
  ] };

  $scope.pp = function(obj) {
    return JSON.stringify(obj, null, 2  )
  }
});