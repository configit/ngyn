describe( 'select2', function() {
  var element, scope;

  beforeEach( module( 'cs.modules' ) );

  beforeEach( function() {
    inject( function( $compile, $rootScope ) {
      scope = $rootScope.$new();
      scope.people = [{ name: 'Fred' }, { name: 'Wilma' }, { name: 'Barney' }];
    } );
  } );

  it( 'should be unable to select an existing item in the collection without cs-key', inject( function( $compile ) {
    scope.person = { name: 'Wilma', remote: true };
    element = $compile( '<select ng-model="person" ng-options="p.name for p in people"></select>' )( scope );
    scope.$digest();
    expect( element.controller( 'ngModel' ).$modelValue ).not.toEqual( scope.people[1] )
    expect( element.val() ).toEqual( '?' );
  } ) );

  it( 'should select an existing item in the collection based only on key', inject( function( $compile ) {
    scope.person = { name: 'Wilma', remote: true };
    element = $compile( '<select key="name" ng-model="person" ng-options="p.name for p in people"></select>' )( scope );
    scope.$digest();
    expect( element.controller( 'ngModel' ).$modelValue ).toEqual( scope.people[1] )
    // Wilma is the second item in the list
    expect( element.val() ).toEqual( '1' );
  } ) );

  it( 'should be unable to select an item based on key when no match', inject( function( $compile ) {
    scope.person = { name: 'Terry' };
    element = $compile( '<select key="name" ng-model="person" ng-options="p.name for p in people"></select>' )( scope );
    scope.$digest();
    expect( element.val() ).toEqual( '?' );
    // make sure that a miss doesn't modify the model
    expect( element.controller( 'ngModel' ).$modelValue ).toEqual( scope.person );
  } ) );
} );