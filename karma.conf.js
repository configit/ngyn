module.exports = function(config) {
  'use strict';

  config.set( {

    frameworks: ['jasmine'],

    // base path, that will be used to resolve files and exclude
    basePath: './',

    // list of files / patterns to load in the browser
    files : [
      'libs/jquery.min.js',
      'libs/jasmine-jquery.js',
      'libs/angular.js',
      'libs/**/*.js',
      'dist/**/*.js',
      'test/**/*.js'
    ],

    // list of files to exclude
    exclude : [

    ],

    preprocessors: {
      'dist/**/*.js': ['coverage']
    },

    coverageReporter: {
      reporters: [
        { type: 'html' },
        { type: 'teamcity' }
      ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters : ['dots'],

    // web server port
    port : 8080,

    // cli runner port
    runnerPort : 9100,

    // enable / disable colors in the output (reporters and logs)
    colors : true,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch : true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers : ['PhantomJS'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout : 10000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun : false
  });
};
