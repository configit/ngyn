describe( 'timespan-picker', function() {
  'use strict';

  var element, scope;

  beforeEach( module( 'ngynTimespanPicker' ) );

  beforeEach( function() {
    inject( function( $compile, $rootScope ) {
      scope = $rootScope.$new();
      scope.oneDay = 86400;
      scope.oneHour = 3600;
      scope.oneMinute = 60;
      scope.oneSecond = 1;
      scope.zeroSeconds = 0;
      scope.nullTimespan = null;
    } );
  } );

  it( 'should select the correct units (days)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneDay"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().value ).toEqual( 1 );
    expect( element.scope().unit.key ).toEqual( 'day' );
  } ) );

  it( 'should select the correct units (hours)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneHour"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().value ).toEqual( 1 );
    expect( element.scope().unit.key ).toEqual( 'hour' );
  } ) );

  it( 'should select the correct units (minutes)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneMinute"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().value ).toEqual( 1 );
    expect( element.scope().unit.key ).toEqual( 'minute' );
  } ) );

  it( 'should select the correct units (seconds)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneSecond"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().value ).toEqual( 1 );
    expect( element.scope().unit.key ).toEqual( 'second' );
  } ) );

  it( 'should select the correct units when zero (seconds)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="zeroSeconds"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().value ).toEqual( 0 );
    expect( element.scope().unit.key ).toEqual( 'second' );
  } ) );

  it( 'should select the correct units when null (seconds)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="nullTimespan"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().value ).toEqual( 0 );
    expect( element.scope().unit.key ).toEqual( 'second' );
  } ) );

  it( 'should set the model when unit is changed', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneDay"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( scope.oneDay ).toEqual( 86400 );

    // Sets the selected unit to hours
    element.scope().unit = element.scope().units[1];
    scope.$digest();

    expect( scope.oneDay ).toEqual( 3600 );
  } ) );

  it( 'should set the model when value is changed', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneMinute"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( scope.oneMinute ).toEqual( 60 );

    // Sets the value
    element.scope().value = 2;
    scope.$digest();

    expect( scope.oneMinute ).toEqual( 120 );
  } ) );

  it( 'should select the correct units when forced (minutes)', inject( function( $compile ) {
    element = $compile( '<ngyn-timespan-picker ng-model="oneDay" units="minute"></ngyn-timespan-picker>' )( scope );
    scope.$digest();
    expect( element.scope().unit.key ).toEqual( 'minute' );
  } ) );

} );