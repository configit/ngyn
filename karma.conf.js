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
      'node_modules/angular/angular.min.js',
      'node_modules/angular-resource/angular-resource.min.js',
      'node_modules/angular-route/angular-route.min.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'libs/**/*.js',
      'dist/ngyn.min.js',
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
    // - ChromeHeadless
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers : ['ChromeHeadless'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 100000,
    browserNoActivityTimeout: 60000,
    browserDisconnectTolerance: 3,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun : false
  });
};
