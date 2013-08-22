module.exports = function(grunt) {
  'use strict';

  var pkg = grunt.file.readJSON('package.json');

  function createConcatOptions( ) {
    var options = {
      options: {
        banner: '/* VERSION: ' + pkg.version + ' */\n',
        separator: ';'
      },
      module: {
        src: ['src/' + pkg.name + '.js'],
        dest: 'dist/' + pkg.name + '.js'
      }
    };

    grunt.file.recurse( 'src',
      function( abspath, rootdir, subdir, filename ) {
        if ( !subdir ) return;

        options[subdir] = {
          src: [rootdir + '/' + subdir + '/**/*.js'],
          dest: 'dist/' + pkg.name + '-' + subdir + '.js'
        };
      } );
    return options;
  }

  grunt.initConfig( {
    concat: createConcatOptions(  ),
    jshint: {
      files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
        force: true
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: [/*'jshint',*/'concat', 'karma:background:run']
    },
    karma: {
      background: {
        configFile: 'karma.conf.js',
        autoWatch: false,
        background: true
      },
      single: {
        configFile: 'karma.conf.js',
        singleRun: true,
        autoWatch: false
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('build', ['jshint', 'concat' ]);
  grunt.registerTask('test', ['karma:single' ]);
  grunt.registerTask('default', ['build', 'karma:single']);
};
