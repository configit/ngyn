module.exports = function(grunt) {
  'use strict';
  var fs = require('fs');

  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-contrib-concat' );
  grunt.loadNpmTasks( 'grunt-karma' );
  grunt.loadNpmTasks( 'grunt-exec' );

  grunt.util.linefeed = '\r\n';

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
    watch: {
      files: ['src/**/*.js', 'test/**/*.js'],
      tasks: ['concat', 'karma:background:start']
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      background: {
        autoWatch: false,
        singleRun: true,
        //background: true
      },
      single: {
        singleRun: true,
        autoWatch: false
      },
      teamcity: {
        singleRun: true,
        autoWatch: false,
        reporters: 'teamcity,coverage'
      }
    },
    exec: {
      nuget: {
        cmd: 'build\\nuget.exe pack ngyn.nuspec -outputdirectory packages-build -verbosity detailed -version ' + semVersion
      }
    }
  } );

  // development tasks
  grunt.registerTask( 'build', ['concat'] );
  grunt.registerTask( 'test', ['karma:single'] );
  grunt.registerTask( 'default', ['build', 'karma:single'] );

  grunt.registerTask( 'packages', 'Create nuget packags', function() {
    grunt.file.delete( 'packages-build', { force: true } );
    grunt.file.mkdir( 'packages-build' );
    grunt.task.run( 'exec:nuget' );
  } );

  grunt.registerTask('sanitizefoldername', 'Removes the browser specific information from the generated coverage folder name', function() {
    fs.readdirSync( 'coverage').forEach( function( dir ) {
      fs.renameSync( 'coverage/' + dir, 'coverage/phantom' );
    } );
  } );

  grunt.registerTask('clean', 'Removes the old coverage folder', function() {
    var rmdir = require('rimraf');
    rmdir.sync( 'coverage/phantom', {} );
  } );

  // build server tasks
  grunt.registerTask( 'patch.karma-teamcity', function() {
    // patch to teamcity.reporter
    // -- from https://github.com/karma-runner/karma-teamcity-reporter/issues/5
    grunt.file.copy( 'patches/karma-teamcity-reporter/index.js',
                     'node_modules/karma-teamcity-reporter/index.js' );
  } );
  grunt.registerTask( 'teamcity.commit', ['clean', 'patch.karma-teamcity', 'build', 'karma:teamcity', 'sanitizefoldername'] );
  grunt.registerTask( 'teamcity.full', ['patch.karma-teamcity', 'build', 'karma:teamcity', 'packages'] );
};
