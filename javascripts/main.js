$(function() {
  
  $(document).on('click', function(e) {
    $('ul#navbar li.open').removeClass('open');
  });

  $('ul#navbar > li').on('click', function(e) {
    if (!$(e.currentTarget).is('.open')) {
      $(e.currentTarget).addClass('open');
      e.stopPropagation();
    }
  });

  $('ul#navbar ul li').on('click', function(e) {
    $('ul#navbar li.open').removeClass('open');
    e.stopPropagation();
  });

})