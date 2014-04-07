module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-concat' );
  grunt.loadNpmTasks( 'grunt-karma' );
  grunt.loadNpmTasks( 'grunt-exec' );

  var pkg = grunt.file.readJSON( 'package.json'),
      teamcityPropsFile = grunt.option( 'teamcity.properties' ),
      teamcityProps = ( teamcityPropsFile && grunt.file.readJSON( teamcityPropsFile ) ) || {},
      major = option( 'Major', '0' ),
      minor = option( 'Minor', '0' ),
      revision = option( 'Revision', '0' ),
      semVersionSuffix = option( 'SemVerSuffix', '-beta' ),
      isDefaultBranch = option( 'is_default_branch', false ) === 'true',
      version = major + '.' + minor + '.' + revision,
      semVersion = isDefaultBranch ? version : version + semVersionSuffix;

  function option( name, def ) {
    return grunt.option( name ) || teamcityProps[ name ] || def;
  }

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
      options: {
        configFile: 'karma.conf.js'
      },
      background: {
        autoWatch: false,
        background: true
      },
      single: {
        singleRun: true,
        autoWatch: false
      },
      teamcity: {
        singleRun: true,
        autoWatch: false,
        reporters: 'teamcity'
      }
    },
    exec: {
      nuget: {
        cmd: 'build\\nuget.exe pack ngyn.nuspec -outputdirectory packages-build -verbosity detailed -version ' + semVersion
      }
    }
  } );

  // development tasks
  grunt.registerTask( 'build', [ 'jshint', 'concat' ] );
  grunt.registerTask( 'test', [ 'karma:single' ] );
  grunt.registerTask( 'default', ['build', 'karma:single'] );
  grunt.registerTask( 'packages', 'Create nuget packags', function() {
    grunt.file.delete( 'packages-build', { force: true } );
    grunt.file.mkdir( 'packages-build' );
    grunt.task.run( 'exec:nuget' );
  } );
  
  // build server tasks
  grunt.registerTask( 'patch.karma-teamcity', function() {
    // patch to teamcity.reporter
    // -- from https://github.com/karma-runner/karma-teamcity-reporter/issues/5
    grunt.file.copy( 'patches/karma-teamcity-reporter/index.js',
                     'node_modules/karma-teamcity-reporter/index.js' );
  } );
  grunt.registerTask( 'teamcity.commit', ['patch.karma-teamcity', 'build', 'karma:teamcity'] );
  grunt.registerTask( 'teamcity.full', ['patch.karma-teamcity', 'build', 'karma:teamcity', 'packages' ] );
};
