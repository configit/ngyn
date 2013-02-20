describe('uiSelect2', function () {
  'use strict';

  var scope, $compile, options, $timeout;
  beforeEach(module('cs.modules'));
  beforeEach(inject(function (_$rootScope_, _$compile_, _$window_, _$timeout_) {
    scope = _$rootScope_.$new();
    $compile = _$compile_;
    $timeout = _$timeout_;
    scope.options = {
      query: function (query) {
        var data = {
          results: [{ id: 1, text: 'first' }]
        };
        query.callback(data);
      }
    };
  }));

  /**
   * Compile a template synchronously
   * @param  {String} template The string to compile
   * @return {Object}          A reference to the compiled template
   */
  function compile(template) {
    var element = $compile(template)(scope);
    scope.$apply();
    //console.log(element.html());
    $timeout.flush();
    return element;
  }

  describe('with a <select> element', function () {
    describe('compiling this directive', function () {
      it('should throw an error if we have no model defined', function () {
        expect(function(){
          compile('<select type="text" ui-reset></select>');
        }).toThrow();
      });
      it('should create proper DOM structure', function () {
        var element = compile('<div><select select2 ng-model="foo"></select></div>');
        expect(element.children().is('div.select2-container')).toBe(true);
      });
    });
    describe('when model is changed programmatically', function(){
      it('should set select2 to the value', function(){
        scope.opts = ['First', 'Second']
        scope.foo = 'First';
        var element = compile('<div><select select2 ng-model="foo" ng-options="a for a in opts" ></select></div>');
        expect(element.find('select').select2('data').text).toBe('First');
        scope.$apply('foo = "Second"');
        $timeout.flush();
        expect(element.find('select').select2('data').text).toBe('Second');
      });
      it('should set select2 to the value for multiples', function(){
        scope.opts = ['First', 'Second', 'Third'];
        scope.foo = ['First'];
        var element = compile('<div><select select2 multiple ng-model="foo" ng-options="a for a in opts"></select></div>');
        scope.$apply();
        expect(element.find('select').select2('data')[0].text).toEqual('First');
        scope.$apply('foo = ["Second"]');
        $timeout.flush();
        expect(element.find('select').select2('data')[0].text).toEqual('Second');
        scope.$apply('foo = ["Second","Third"]');
        $timeout.flush();
        expect(element.find('select').select2('data')[0].text).toEqual('Second');
        expect(element.find('select').select2('data')[1].text).toEqual('Third');
      });
    });
    xit('should observe the disabled attribute', function () {
      var element = compile('<select select2 ng-model="foo" ng-disabled="disabled"></select>');
      expect(element.siblings().hasClass('select2-container-disabled')).toBe(false);
      scope.$apply('disabled = true');
      expect(element.siblings().hasClass('select2-container-disabled')).toBe(true);
      scope.$apply('disabled = false');
      expect(element.siblings().hasClass('select2-container-disabled')).toBe(false);
    });
    xit('should observe the multiple attribute', function () {
      var element = $compile('<div><select select2 ng-model="foo" ng-multiple="multiple"></select></div>')(scope);

      expect(element.siblings().hasClass('select2-container-multi')).toBe(false);
      scope.$apply('multiple = true');
      expect(element.siblings().hasClass('select2-container-multi')).toBe(true);
      scope.$apply('multiple = false');
      expect(element.siblings().hasClass('select2-container-multi')).toBe(false);
    });
  });
  describe('with an <input> element', function () {
    describe('compiling this directive', function () {
      it('should throw an error if we have no model defined', function () {
        expect(function() {
          compile('<input select2>');
        }).toThrow();
      });
      it('should create proper DOM structure', function () {
        var element = compile('<div><input ng-model="foo" select2="options"></div>');
        expect(element.find('.select2-container').length).toEqual(1);
      });
    });
    describe('when model is changed programmatically', function(){
      describe('for single-select', function(){
        it('should call select2(data, ...) for objects', function(){
          var element = compile('<div><input ng-model="foo" select2="options"></div>');
          spyOn($.fn, 'select2');
          scope.$apply('foo={ id: 1, text: "first" }');
          expect(element.find('input').select2).toHaveBeenCalledWith('data', { id: 1, text: "first" });
        });
        xit('should call select2(val, ...) for strings', function(){
          var element = compile('<div><input ng-model="foo" select2="options"></div>');
          spyOn($.fn, 'select2');
          scope.$apply('foo="first"');
          expect(element.find('input').select2).toHaveBeenCalledWith('data', 'first');
        });
      });
      describe('for multi-select', function(){
        it('should call select2(data, ...) for arrays', function(){
          var element = compile('<div><input ng-model="foo" multiple select2="options"></div>');
          spyOn($.fn, 'select2');
          scope.$apply('foo=[{ id: 1, text: "first" },{ id: 2, text: "second" }]');
          expect(element.select2).toHaveBeenCalledWith('data', [{ id: 1, text: "first" },{ id: 2, text: "second" }]);
        });
        it('should call select2(data, []) for falsey values', function(){
          var element = compile('<div><input ng-model="foo" multiple select2="options"></div>');
          spyOn($.fn, 'select2');
          scope.$apply('foo=[]');
          expect(element.select2).toHaveBeenCalledWith('data', []);
        });
        xit('should call select2(val, ...) for strings', function(){
          var element = compile('<input ng-model="foo" multiple select2="options">');
          spyOn($.fn, 'select2');
          scope.$apply('foo="first,second"');
          expect(element.select2).toHaveBeenCalledWith('val', 'first,second');
        });
      });
    });
  });
});