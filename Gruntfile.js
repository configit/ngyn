module.exports = function(grunt) {
  'use strict';

  var pkg = grunt.file.readJSON('package.json'),
      major = grunt.option( 'Major') || '0',
      minor = grunt.option( 'Minor' ) || '0',
      revision = grunt.option( 'Revision' ) || '0',
      semVersionSuffix = grunt.option( 'SemVerSuffix') || '-beta',
      isDefaultBranch = grunt.option( 'is_default_branch' ) === 'true',
      version = major + '.' + minor + '.' + revision,
      semVersion = isDefaultBranch ? version : version + semVersionSuffix;

  function createConcatOptions( ) {
    var options = {
      options: {
        banner: '/* VERSION: ' + semVersion + ' */\n',
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
      tasks: ['concat', 'jshint', 'karma:background:run']
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
    },
    exec: {
      nuget: {
        cmd: 'build\\nuget.exe pack ngyn.nuspec -outputdirectory packages-build -verbosity detailed -version ' + semVersion
      }
    }
  } );

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('build', ['jshint', 'concat' ]);
  grunt.registerTask('test', ['karma:single' ]);
  grunt.registerTask('default', ['build', 'karma:single']);
  grunt.registerTask('packages', 'Create nuget packags', function() {
    grunt.file.delete( 'packages-build', { force: true } );
    grunt.file.mkdir( 'packages-build' );
    grunt.task.run( 'exec:nuget' );
  } );
};