'use strict';

const gulp = require( 'gulp' );
const ngAnnotate = require( 'gulp-ng-annotate' );
const uglify = require( 'gulp-uglify' );
const watch = require( 'gulp-watch' );
const concat = require( 'gulp-concat' );
const rename = require( 'gulp-rename' );
const insert = require( 'gulp-insert' );
const merge = require( 'gulp-merge' );
const fs = require( 'fs' );
const util = require( 'util' );
const exec = util.promisify( require('child_process').exec );
const karma = require( 'karma').Server;
const colors = require( 'colors/safe' );

const outputDirectory = 'dist';
const srcFiles = 'src/**/*.js';
const testFiles = 'test/**/*.js';

function buildAndWatch() {
  log( '(WATCH) Building initial bundle' );
  return build( true )
    .then( () => watchAndBuild( srcFiles ) );
}

function runTestsAndWatch() {
  build( true )
    .then( runTests, () => {} )
    .then( watchAndBuild( srcFiles, runTests ) )
    .then( watchAndBuild( testFiles, runTests ) );

  return new Promise( () => {} );
}

async function buildDistAndVersion() {
  const version = getVersion();
  const buildDate = new Date().toDateString();
  const header = `/*! ngyn \r\n * Version: ${version}\r\n * Built: ${buildDate} \r\n */\r\n\r\n`;

  console.log( '(VERSION) Adding file headers' );

  await new Promise( resolve => {
    merge(
      gulp.src( 'dist/ngyn.js' ).pipe( insert.prepend( header ) ),
      gulp.src( 'dist/ngyn.min.js' ).pipe( insert.prepend( header ) )
    )
    .pipe( gulp.dest( 'dist' ) )
    .on( 'end', resolve )
  } );

  console.log( `(VERSION) Setting package version to ${version}` );
  const {stdout, stderr} = await exec( `npm version --no-git-tag-version ${version}` );
  console.log( `(NPM-VERSION) ${stdout}` );
  console.log( `(NPM-VERSION) ${stderr}` );

  return Promise.resolve();
};

async function publishToNpm() {
  const localLoginExists = fs.existsSync('.npmrc' );
  
  var authToken = process.env.NGYN_NPM_TOKEN;

  if ( !localLoginExists ) {
    fs.writeFileSync( '.npmrc', `//registry.npmjs.org/:_authToken=${authToken}` );
  }

  console.log( '(PUBLISH) Starting npm publish' )
  const {stdout, stderr} = await exec( `npm publish` );
  console.log( `(NPM-PUBLISH) ${stdout}` );
  console.log( `(NPM-PUBLISH) ${stderr}` );
  
  if ( !localLoginExists ) {
    fs.unlinkSync( '.npmrc' );
  }

  return Promise.resolve();
}

/*
function nugetPack() {
  const version = getVersion();
  const p = Promise.all( [
    new Promise( resolve => fs.mkdir( 'packages-build', resolve ) ),
    new Promise( resolve => {
      exec( 
        `build\\nuget.exe pack ngyn.nuspec -outputdirectory packages-build -verbosity detailed -version ${version}`, 
        ( err, stdout, stderr ) => { 
          console.log( stdout );
          console.log( stderr );
          resolve();
        }
      );
    } )
  ] );
  return p;
}
*/

function getVersion() {
  const versionArgumentName = '--ngyn-version';
  const buildNumberArgumentName = '--ngyn-build';
  const isReleaseArgumentName = '--ngyn-is-release';
  let versionArg = process.argv.find( a => a.toLowerCase().startsWith( `${versionArgumentName}=` ) );
  let buildNumberArg = process.argv.find( a => a.toLowerCase().startsWith( `${buildNumberArgumentName}=` ) );
  let isReleaseArg = process.argv.find( a => a.toLowerCase().startsWith( `${isReleaseArgumentName}=` ) );
  
  if ( !versionArg ) {
    throw `Cannot find version argument. It must be passed in the format --ngyn-version=1.2.3-alpha2`;
  }

  let versionString = versionArg.substring( versionArgumentName.length + 1 );

  const isRelease = isReleaseArg && isReleaseArg.substring( isReleaseArgumentName.length + 1 ) === 'true';
  if ( !isRelease ) {
    if ( !buildNumberArg ) {
      throw `A buildNumber must be provided if '--ngyn-is-release' is not set.`;
    }
    buildNumberArg = buildNumberArg.substring( buildNumberArgumentName.length + 1 );
    buildNumberArg = buildNumberArg.padStart( 4, '0' );

    versionString += `-alpha${buildNumberArg}`;
  }

  return versionString;
}

function log( msg, startTime ) {
  const date = new Date();
  const timeTaken = !startTime ? '' : ' Took ' + ( date - startTime ) + ' ms';
  console.log( `[${date.toLocaleTimeString()}] ${msg}${timeTaken}` );
}

function build( continueOnError ) {
  log( '(BUILD) Building bundle' );
  const start = new Date();

  return new Promise( (resolve, reject) => {
    gulp.src( srcFiles )
      .pipe( concat( 'ngyn.js') )
      .pipe( ngAnnotate() )
      .on( 'error', function( ex ) {
        if ( continueOnError ) {
          log( colors.red( `(ANNOTATE) ${ex.message}` ) );
          log( '(BUILD) Failed' )
          reject();
        }
      } )
      .pipe( gulp.dest( outputDirectory ) )
      .pipe( uglify() )
      .pipe( rename( 'ngyn.min.js' ) )
      .pipe( gulp.dest( outputDirectory ) )
      .on( 'end', () => {
        log( '(BUILD) Finished.', start );
        resolve();
      } );
  } );
}

function watchAndBuild( files, callback ) {
  log( `(WATCH) Watching ${files}` );

  watch( files, e => {
    log( `(WATCH) ${e.history[0]} changed...` );
    build( true ).then( () => {
      callback && callback();
    } );
  } );

  // watch never ends
  return new Promise( () => {} );
}

function runTests() {
  const p = new Promise( resolve => {
    log( '(TEST) Test run starting' );

    const karmaConfig = {
      configFile: `${__dirname}/karma.conf.js`,
      singleRun: true
    };

    if ( process.argv.find( a => a.toLowerCase() === '--teamcity' ) ) {
      karmaConfig.reporters = ['teamcity'];
    }

    const start = new Date();
    new karma( karmaConfig, () => {
      log( '(TEST) Finished.', start );
      resolve();
    } ).start();
  } );

  return p;
}

const testTask = gulp.series( build, runTests );
const publishTask = gulp.series( testTask, buildDistAndVersion, publishToNpm );

exports.build = build;
exports.test = testTask;

exports.buildWatch = buildAndWatch;
exports.testWatch = runTestsAndWatch;

exports.publish = publishTask;

exports.default = runTestsAndWatch;
