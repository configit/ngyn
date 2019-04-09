( function( angular ) {
  var sendKeys = function( value ) {
    this.val( value );
    this.trigger( $.Event('change') );
  };
  
  var selectOption = function( value ) {
    this.val( value );
    this.trigger( $.Event('change') );
  };

  angular.element.prototype.sendKeys = $.prototype.sendKeys = sendKeys;
  angular.element.prototype.selectOption = $.prototype.selectOption = selectOption;

} )( window.angular );