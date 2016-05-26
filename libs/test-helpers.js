( function( angular ) {
  var sendKeys = function( value ) {
    this.val( value );

    var e = $.Event( 'input' );
    var e2 = $.Event( 'keydown' );
    for ( var i = 0; i < value.length; i++ ) {
      e.which = e2.which = value.charCodeAt( i );
      this.trigger( e );
      this.trigger( e2 );
    }

    // if value is blank send a backspace
    if ( !value.length ) {
      e = $.Event( 'input' );
      e.which = 8;
      this.trigger( e );
    }
  };
  
  var selectOption = function( value ) {
    this.val( value );

    var e = $.Event( 'change' );
    this.trigger( e );
  };

  angular.element.prototype.sendKeys = $.prototype.sendKeys = sendKeys;
  angular.element.prototype.selectOption = $.prototype.selectOption = selectOption;

} )( window.angular );