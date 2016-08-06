/*
 * A large part of this suite of tests is taken from the angular-ui project as the directives
 * share most of the same requirements.
 */
describe( 'ngyn select2', function() {
  'use strict';

  var scope, $compile, $timeout;

  beforeEach( module( 'ngynSelect2' ) );

  beforeEach( inject( function( _$rootScope_, _$compile_, _$window_, _$timeout_ ) {
    scope = _$rootScope_.$new();
    $compile = _$compile_;
    $timeout = _$timeout_;
    scope.options = {
      query: function( query ) {
        var data = {
          results: [{ id: 1, text: 'first' }]
        };
        query.callback( data );
      }
    };
    scope.customRenderingOptions = {
      query: function( query ) {
        var data = {
          results: [{ first: 'Donald', second: 'Duck' }, { first: 'Bugs', second: 'Bunny' }, { first: 'Mickey', second: 'Mouse' }]
        };
        query.callback( data );
      }
    };
  } ) );

  /**
   * Compile a template synchronously
   * @param  {String} template The string to compile
   * @return {Object}          A reference to the compiled template
   */
  function compile( template ) {
    var element = $compile( template )( scope );
    $timeout.flush();
    scope.$apply();
    return element;
  }

  describe( 'with a <select> element', function() {

    describe( 'compiling this directive', function() {

      it( 'should create proper DOM structure', function() {
        var element = compile( '<div><select ngyn-select2 ng-model="foo"></select></div>' );
        expect( element.children().is( 'div.select2-container' ) ).toBe(true);
      } );
    } );

    describe( 'when model is changed programmatically', function() {

      it( 'should set select2 to the value', function() {
        scope.opts = ['First', 'Second'];
        scope.foo = 'First';
        var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-options="a for a in opts" ></select></div>' );
        expect( element.find( 'select' ).select2( 'data' ).text ).toBe( 'First' );
        scope.$apply( 'foo = "Second"' );
        expect( element.find( 'select' ).select2( 'data' ).text ).toBe( 'Second' );
      } );

      it( 'should set select2 to the value for multiples', function() {
        scope.opts = ['First', 'Second', 'Third'];
        scope.foo = ['First'];
        var element = compile( '<div><select ngyn-select2 multiple ng-model="foo" ng-options="a for a in opts"></select></div>' );
        scope.$apply();
        expect( element.find( 'select' ).select2( 'data' )[0].text ).toEqual( 'First' );
        scope.$apply( 'foo = ["Second"]' );
        expect( element.find( 'select' ).select2( 'data' )[0].text ).toEqual( 'Second' );
        scope.$apply( 'foo = ["Second","Third"]' );
        expect( element.find( 'select' ).select2( 'data' )[0].text ).toEqual( 'Second' );
        expect( element.find( 'select' ).select2( 'data' )[1].text ).toEqual( 'Third' );
      } );
    } );

    it( 'should follow the disabled attribute when it is set before select2 initializes', function() {
      scope.disabled = true;
      var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-disabled="disabled"></select></div>' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-container-disabled' ) ).toBe( true );
      expect( element.find( '.select2-container' ).hasClass( 'select2-container-disabled' ) ).toBe( true );
    } );

    it( 'should follow the disabled attribute when it is set after select2 initializes', function() {
      var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-disabled="disabled"></select></div>' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-container-disabled' ) ).toBe( false );
      scope.$apply( 'disabled = true' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-container-disabled' ) ).toBe( true );
      scope.$apply( 'disabled = false' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-container-disabled' ) ).toBe( false );
    } );

    it( 'should follow the required attribute when it is set to true before select2 initializes', function() {
      scope.required = true;
      var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-required="required"></select></div>' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-allowclear' ) ).toBe( false );
      expect( element.find( '.select2-container' ).hasClass( 'ng-valid-required' ) ).toBe( false );
    } );

    it( 'should follow the required attribute when it is set to false before select2 initializes', function() {
      scope.required = false;
      var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-required="required"></select></div>' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-allowclear' ) ).toBe( true );
      expect( element.find( '.select2-container' ).hasClass( 'ng-valid-required' ) ).toBe( true );
    } );


    it( 'should follow the required attribute and allow clear for non-required', function() {
      var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-required="required"></select></div>' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-allowclear' ) ).toBe( true );
      expect( element.find( '.select2-container' ).hasClass( 'ng-valid-required' ) ).toBe( true );
      scope.$apply( 'required = true' );
      expect( element.find( '.select2-container' ).hasClass( 'select2-allowclear' ) ).toBe( false );
      expect( element.find( '.select2-container' ).hasClass( 'ng-valid-required' ) ).toBe( false );
      scope.$apply( 'foo = 1' );
      expect( element.find( '.select2-container' ).hasClass( 'ng-valid-required' ) ).toBe( true );
      scope.$apply( 'foo = undefined;required = false' );
      expect( element.find( '.select2-container' ).hasClass( 'ng-valid-required' ) ).toBe( true );
    } );

    it( 'should handle a static placeholder correctly', function() {
      var placeholderText = 'Select Something...';
      scope.opts = [ { id: 1, name: 'test 1' }, { id: 2, name: 'test 2' } ];
      var element = compile(
        '<div><select ngyn-select2 ng-model="selected">' +
          '<option value="">' + placeholderText + '</option>' +
        '</select></div>' );

      expect( element.find( 'select option' ).eq(0).text() ).toBe( placeholderText );
    } );

    it( 'should handle a dynamic placeholder correctly', function() {
      scope.opts = [ { id: 1, name: 'test 1' }, { id: 2, name: 'test 2' } ];
      scope.entityName = 'Car';
      var element = compile(
        '<div><select ngyn-select2 ng-model="selected">' +
          '<option value="">Select {{ entityName }}...</option>' +
        '</select></div>' );
      expect( element.find( 'select option' ).text() ).toBe( 'Select Car...' );
      expect( element.select2('container').find( '.select2-chosen' ).text() ).toBe( 'Select Car...' );

      scope.$apply( function() { scope.entityName = 'Cat'; });
      expect( element.find( 'select option' ).eq(0).text() ).toBe( 'Select Cat...' );
      expect( element.select2('container').find( '.select2-chosen' ).text() ).toBe( 'Select Cat...' );
    } );

    it( 'should handle a dynamic placeholder correctly when switching away and back from the placeholder', function() {
      scope.opts = [ { id: 1, name: 'test 1' }, { id: 2, name: 'test 2' } ];
      scope.entityName = 'Car';
      scope.selected = scope.opts[0];
      var element = compile(
        '<div><select ngyn-select2 ng-options="opt.name for opt in opts" ng-model="selected">' +
          '<option value="">Select {{ entityName }}...</option>' +
        '</select></div>' );

      // ensure the placeholder is not currently selected
      expect( element.find('select').select2( 'val' ) ).toBeTruthy();

      scope.$apply( function() { scope.entityName = 'Cat'; scope.selected = null; });
      expect( element.find( 'select option' ).eq(0).text() ).toBe( 'Select Cat...' );
      expect( element.select2('container').find( '.select2-chosen' ).text() ).toBe( 'Select Cat...' );
    } );

    /*
     * ngyn-select2 does not support dynamically choosing single/multiple
     * programatically
     */
    xit( 'should observe the multiple attribute', function() {
      var element = compile( '<div><select ngyn-select2 ng-model="foo" ng-multiple="multiple"></select></div>' );
      expect( element.siblings().hasClass( 'select2-container-multi' ) ).toBe( false );
      scope.$apply( 'multiple = true' );
      expect( element.siblings().hasClass( 'select2-container-multi' ) ).toBe( true );
      scope.$apply( 'multiple = false' );
      expect( element.siblings().hasClass( 'select2-container-multi' ) ).toBe( false );
    } );

    it (' should sync classes between select and select2', function() {
      var element = compile( '<div><select ngyn-select2 ng-model="foo"></select></div>' );
      scope.$apply( element.find('select').addClass('my-class') );
      expect( element.find('select').select2('container').hasClass('my-class') ).toBe( true );
    } );

    it (' should not sync select2- classes between select and select2', function() {
      var element = compile( '<div><select ngyn-select2 ng-model="foo"></select></div>' );
      scope.$apply( element.find('select').addClass('select2-offscreen') );
      expect( element.find('select').select2('container').hasClass('select2-offscreen') ).toBe( false );
    } );
  } );

  describe( 'with an <input> element', function() {

    describe( 'compiling this directive', function() {

      it( 'should create proper DOM structure', function() {
        var element = compile( '<div><input ng-model="foo" ngyn-select2="options"></div>' );
        expect( element.children().is( 'div.select2-container' ) ).toBe(true);
      } );
    } );

    describe( 'when model is changed programmatically', function() {

      describe( 'for single-select', function() {

        it( 'should call select2(data, ...) for objects', function() {
          var element = compile( '<div><input ng-model="foo" ngyn-select2="options"></div>' );
          spyOn( $.fn, 'select2' );
          scope.$apply( 'foo={ id: 1, text: "first" }' );
          expect( element.find( 'input' ).select2 ).toHaveBeenCalledWith( 'data', { id: 1, text: "first" } );
        } );

        it( 'should call select2(data, ...) for objects with custom rendering', function() {
          var element = compile( '<div><input ng-model="foo" custom-rendering ngyn-select2="customRenderingOptions"></div>' );
          setFixtures( element );
          spyOn( $.fn, 'select2' );
          scope.$apply( 'foo={ first:\'Donald\', last:\'Duck\' }' );
          expect( element.find( 'input' ).select2 ).toHaveBeenCalledWith( 'data', { first:"Donald", last:"Duck" } );
        } );
      } );

      describe( 'for multi-select', function() {

        it( 'should call select2(data, ...) for arrays', function() {
          var element = compile( '<div><input ng-model="foo" multiple ngyn-select2="options"></div>' );
          spyOn( $.fn, 'select2' );
          scope.$apply( 'foo=[{ id: 1, text: "first" },{ id: 2, text: "second" }]' );
          expect( element.select2 ).toHaveBeenCalledWith( 'data', [{ id: 1, text: "first" }, { id: 2, text: "second" }] );
        } );

        it( 'should call select2(data, []) for falsey values', function() {
          var element = compile( '<div><input ng-model="foo" multiple ngyn-select2="options"></div>' );
          spyOn( $.fn, 'select2' );
          scope.$apply( 'foo=[]' );
          expect( element.select2 ).toHaveBeenCalledWith( 'data', [] );
        } );

        it( 'should call select2(data, ...) for arrays with custom rendering', function() {
          var element = compile( '<div><input ng-model="foo" custom-rendering multiple ngyn-select2="customRenderingOptions"></div>' );
          spyOn( $.fn, 'select2' );
          scope.$apply( 'foo=[{ first: "Mickey", last: "Mouse" },{ first: "Donald", last: "Duck" }]' );
          expect( element.select2 ).toHaveBeenCalledWith( 'data', [{ first: 'Mickey', last: 'Mouse' }, { first: 'Donald', last: 'Duck' }] );
        } );
      } );
    } );
  } );
} );
