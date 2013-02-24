describe( 'select2', function() {
  var element, scope;

  beforeEach( module( 'cs.modules' ) );

  beforeEach( function() {
    inject( function( $compile, $rootScope ) {
      scope = $rootScope.$new();
      scope.people = [{ name: 'Fred' }, { name: 'Wilma' }, { name: 'Barney' }];
    } );
  } );

  it( 'do something', inject( function( $compile ) {
    scope.person = { name: 'Wilma', remote: true };
    element = $compile( '<select ng-model="person" ng-options="p.name for p in people"></select>' )( scope );
    scope.$digest();
    expect( element.controller( 'ngModel' ).$modelValue ).not.toEqual( scope.people[1] )
    expect( element.val() ).toEqual( '?' );
  } ) );

} );