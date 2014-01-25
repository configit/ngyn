module.exports = function(grunt) {
  'use strict';
  
  var _this = this;
  
  grunt.registerMultiTask('ngynWebResources', 'Convert css, html and images into stringified resources consumable via angular', function() {
    var options = this.options({
      module: 'custom-web-resources',
      service: 'WebResources'
    });

    this.files.forEach(function( file ) {
      
      var result = "angular.module('" + options.module + "', [])"
        + ".service('"+ options.service +"', function() {\r\n"
        + "  this.files = {};\r\n"

        + "  this.attachCss = function(filename) {\r\n"
        + "    var styleTag = document.createElement('style');\r\n"
        + "    styleTag.type = 'text/css';\r\n"
        + "    styleTag.innerHTML = '\\r\\n' + this.files[filename] + '\\r\\n';\r\n"
        + "    document.getElementsByTagName('head')[0].appendChild( styleTag )\r\n"
        + "  }\r\n";

      file.src.forEach(function(src) {
        var extension = src.substr(src.lastIndexOf('.')).toLowerCase();
        if (extension === '.jpg' || extension === '.gif') {
          // base 64 this.
          return;
        } else {
        var contents = grunt.file.read(src)
          .replace(new RegExp('\r\n', 'g'), '\\r\\n')
          .replace(new RegExp('\n', 'g'), '\\n')
          .replace(/'/g, "\\'");
        }
        result += "  this.files['" + src + "'] = '" + contents + "';\r\n";
      });
      
      result += "});";

      grunt.file.write(file.dest, result);
      grunt.log.writeln('File "' + file.dest + '" created.');
    });
    
  });
};
