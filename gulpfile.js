/* eslint-env node, es6 */
/* global Promise */
/* eslint-disable key-spacing, one-var, no-multi-spaces, max-nested-callbacks, quote-props */

'use strict';

// ################################
// Load Gulp and tools we will use.
// ################################
var gulp      = require('gulp'),
  $           = require('gulp-load-plugins')(),
  browserSync = require('browser-sync').create(),
  del         = require('del'),
  // gulp-load-plugins will report "undefined" error unless you load gulp-sass manually.
  sass        = require('gulp-sass'),
  magicImporter = require('node-sass-magic-importer'),
  kss         = require('kss'),
  path = require('path'),
  gulpStylelint = require('gulp-stylelint');
// #############################
// Set paths and options
// #############################

// The root paths are used to construct all the other paths in this
// configuration. The "project" root path is where this gulpfile.js is located.

var options = {};

options.rootPath = {
  project     : __dirname + '/',
  theme       : __dirname + '/'
};

options.theme = {
  name       : 'uwmedicineorg',
  root       : options.rootPath.theme,
  source     : {
    uwmbaseinit : options.rootPath.theme + '../uwmbase/init',
    base        : options.rootPath.theme + 'src/',
    components  : options.rootPath.theme + 'src/components/',
    scss        : options.rootPath.theme + 'src/scss/',
    js          : options.rootPath.theme + 'src/js/',
    images      : options.rootPath.theme + 'src/images/',
    styleguide  : options.rootPath.theme + 'src/styleguide/',
  },
  build      : {
    base        : options.rootPath.theme + 'dist/',
    css         : options.rootPath.theme + 'dist/css/',
    js          : options.rootPath.theme + 'dist/js/',
    images      : options.rootPath.theme + 'dist/images/',
    styleguide  : options.rootPath.theme + 'dist/styleguide/',
  }
};

// Set the URL used to access the Drupal website under development. This will
// allow Browser Sync to serve the website and update CSS changes on the fly.
options.drupalURL = 'http://uwmed.local';
// options.drupalURL = 'http://localhost';

// Define the node-sass configuration. The includePaths is critical!
// We're using node-sass-tilde-importer which turns ~ into absolute paths to
// the nearest parent node_modules directory.
options.sass = {
  importer: magicImporter(),
  includePaths: [
    options.theme.source.scss,
    options.theme.source.components
  ],
  outputStyle: 'expanded'
};

// Define which browsers to add vendor prefixes for.
options.autoprefixer = {
  browsers: [
    'last 2 versions',
    'ios >= 8'
  ]
};

// Define the style guide paths and options.

// options.styleGuide = {
//   source: [
//     options.theme.source.styleguide,
//     options.theme.source.scss,
//     options.theme.source.components
//   ],
//   destination: options.theme.build.styleguide,

//   builder: 'builder/twig',
//   namespace: options.theme.name + ':' + options.theme.source.components,
//   'extend-drupal8': true,

//   // The css and js paths are URLs, like '/misc/jquery.js'.
//   // The following paths are relative to the generated style guide.
//   css: [
//     // google fonts
//     'https://fonts.googleapis.com/css?family=Encode+Sans:300,400,500,600,700|Open+Sans:400,400i,600,600i,700,700i',
//     // base/special stylesheets
//     path.relative(options.theme.build.styleguide, options.theme.build.css + 'kss-only.css'),
//     path.relative(options.theme.build.styleguide, options.theme.build.css + 'base.css'),
//     // component stylesheets
//     path.relative(options.theme.build.styleguide, options.theme.build.css + 'header.css'),
//     path.relative(options.theme.build.styleguide, options.theme.build.css + 'provider-card.css'),
//     path.relative(options.theme.build.styleguide, options.theme.build.css + 'modal-video.css')
//   ],
//   js: [
//     // use drupal's version of jquery and add Drupal
//     '/core/assets/vendor/jquery/jquery.min.js',
//     '/core/misc/drupal.js',
//     // fontawesome
//     'https://use.fontawesome.com/releases/v5.3.1/js/all.js',
//     // bootstrap
//     path.relative(options.theme.build.styleguide, options.theme.build.bootstrapjs + 'util.js'),
//     path.relative(options.theme.build.styleguide, options.theme.build.bootstrapjs + 'alert.js'),
//     path.relative(options.theme.build.styleguide, options.theme.build.bootstrapjs + 'modal.js'),
//     // components js
//     path.relative(options.theme.build.styleguide, options.theme.build.js + 'modal-video.js')
//   ],

//   homepage: 'homepage.md',
//   title: 'UW Medicine Base Theme Style Guide'
// };

// Define the paths to the JS files to lint.
options.eslint = {
  files  : [
    // options.rootPath.project + 'gulpfile.js',
    options.theme.source.js + '*.js',
    '!' + options.theme.source.js + '**/*.min.js',
    options.theme.components + '**/*.js',
    '!' + options.components + '**/*.min.js',
    options.theme.build.js + '**/*.js',
    '!' + options.theme.build.js + '**/*.js'
  ]
};

// If your files are on a network share, you may want to turn on polling for
// Gulp watch. Since polling is less efficient, we disable polling by default.
options.gulpWatchOptions = {};
// options.gulpWatchOptions = {interval: 1000, mode: 'poll'};

// The default task.
gulp.task('default', ['build']);

// #################
// Build everything.
// #################
gulp.task('build', ['styles', 'js', 'images', 'lint']);

gulp.task('build:production', ['styles:production', 'js:production', 'images', 'lint']);

// ##########
// Compile CSS.
// ##########
var sassFiles = [
  options.theme.source.uwmbaseinit + '**/*.scss',
  options.theme.source.scss + '**/*.scss',
  options.theme.source.components + '**/*.scss',
  options.theme.source.styleguide + '*.scss',
  // Do not open Sass partials as they will be included as needed.
  '!' + options.theme.source.uwmbaseinit + '**/_*.scss',
  '!' + options.theme.source.scss + '**/_*.scss',
  '!' + options.theme.source.components + '**/_*.scss',
  '!' + options.theme.source.styleguide + '_*.scss'
];

gulp.task('styles', ['clean:css'], function () {
  return gulp.src(sassFiles)
    .pipe($.sourcemaps.init())
    .pipe(sass(options.sass).on('error', sass.logError))
    .pipe($.autoprefixer(options.autoprefixer))
    .pipe($.rename({dirname: ''}))
    .pipe($.size({showFiles: true}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(options.theme.build.css))
    .pipe($.if(browserSync.active, browserSync.stream({match: '**/*.css'})));
});

gulp.task('styles:production', ['clean:css'], function () {
  return gulp.src(sassFiles)
    .pipe(sass(options.sass).on('error', sass.logError))
    .pipe($.autoprefixer(options.autoprefixer))
    .pipe($.rename({dirname: ''}))
    .pipe($.size({showFiles: true}))
    .pipe(gulp.dest(options.theme.build.css));
});

// ##################
// Compile JS
// ##################
gulp.task('js', ['clean:js'], function () {
  return gulp.src([
    options.theme.source.components + '**/*.js',
    options.theme.source.js + '**/*.js'
  ])
    .pipe($.sourcemaps.init())
    .pipe($.rename({dirname: ''}))
    .pipe($.babel({
        presets: ['babel-preset-env']
    }))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(options.theme.build.js))
    .pipe($.if(browserSync.active, browserSync.stream({match: '**/*.js'})));
});

gulp.task('js:production', ['clean:js', 'js:vendor'], function () {
  return gulp.src([
    options.theme.source.components + '**/*.js',
    options.theme.source.js + '**/*.js'
  ])
    .pipe($.rename({dirname: ''}))
    .pipe(gulp.dest(options.theme.build.js));
});

// ##################
// Build style guide.
// ##################
// gulp.task('styleguide', ['clean:styleguide'], function () {
//   return kss(options.styleGuide);
// });

// Debug the generation of the style guide with the --verbose flag.
// gulp.task('styleguide:debug', ['clean:styleguide'], function () {
//   options.styleGuide.verbose = true;
//   return kss(options.styleGuide);
// });

// #########################
// Lint Sass and JavaScript.
// #########################
gulp.task('lint', ['lint:sass', 'lint:js']);

// Lint JavaScript.
gulp.task('lint:js', function () {
  return gulp.src(options.eslint.files)
    .pipe($.eslint({
      useEslintrc: true,
      envs: ['mocha', 'node', 'es6'],
      fix: true
    }))
    .pipe($.eslint.format());
});

// Lint JavaScript and throw an error for a CI to catch.
gulp.task('lint:js-with-fail', function () {
  return gulp.src(options.eslint.files)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

// Lint Sass.
gulp.task('lint:sass', function () {
  return gulp.src([
    options.theme.source.components + '**/*.scss'
  ])
    .pipe(gulpStylelint({
      reportOutputDir: 'reports/lint',
      reporters: [
        {formatter: 'string', console: true},
        {formatter: 'verbose', save: 'config-standard-verbose.txt'}
      ]
    }));
});

// Lint Sass and throw an error for a CI to catch.
gulp.task('lint:sass-with-fail', function () {
  return gulp.src([
      options.theme.source.components + '**/*.scss'
  ])
    .pipe(gulpStylelint({
      failAfterError: true,
      reportOutputDir: 'reports/lint',
      reporters: [
        {formatter: 'string', console: true},
        {formatter: 'verbose', save: 'config-standard-verbose.txt'}
      ]
    }));
});

// #######################
// Move and Minify Images
// #######################

gulp.task('images', ['clean:images'], function () {
    return gulp.src([
        options.theme.source.images + '**/*.*'
    ])
      .pipe($.imagemin({
          progressive: true,
          svgoPlugins: [{
              removeViewBox: false
          }]
      }))
      .pipe(gulp.dest(options.theme.build.images));
});

// ##############################
// Watch for changes and rebuild.
// ##############################
gulp.task('watch', ['browser-sync', 'watch:js']);

gulp.task('browser-sync', ['watch:css'], function () {
  if (!options.drupalURL) {
    return Promise.resolve();
  }
  return browserSync.init({
    proxy: options.drupalURL,
    noOpen: false
  });
});

gulp.task('watch:css', ['styles'], function () {
  return gulp.watch(options.theme.source.components + '**/*.scss', options.gulpWatchOptions, ['styles']);
});

// gulp.task('watch:lint-and-styleguide', ['styleguide', 'lint:sass'], function () {
//   return gulp.watch([
//     options.theme.source.components + '**/*.scss',
//     options.theme.source.components + '**/*.twig'
//   ], options.gulpWatchOptions, ['styleguide', 'lint:sass']);
// });

gulp.task('watch:js', ['lint:js'], function () {
  return gulp.watch(options.eslint.files, options.gulpWatchOptions, ['lint:js']);
});

// ######################
// Clean all directories.
// ######################
gulp.task('clean', ['clean:css', 'clean:js', 'clean:images']);

// Clean style guide files.
// gulp.task('clean:styleguide', function () {
//   // You can use multiple globbing patterns as you would with `gulp.src`
//   return del([
//     options.styleGuide.destination + '*.html',
//     options.styleGuide.destination + 'kss-assets',
//     options.theme.build.base + 'twig/*.twig'
//   ], {force: true});
// });

// Clean CSS files.
gulp.task('clean:css', function () {
  return del([
    options.theme.build.css + '**/*.css',
    options.theme.build.css + '**/*.map'
  ], {force: true});
});

// Clean JS files.
gulp.task('clean:js', function () {
  return del([
    options.theme.build.js + '**/*.js',
    options.theme.build.js + '**/*.map'
  ], {force: true});
});

// Clean Image files.
gulp.task('clean:images', function () {
    return del([
        options.theme.build.images + '**/*.*'
    ], {force: true});
});

// Resources used to create this gulpfile.js:
// - https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js
// - https://github.com/dlmanning/gulp-sass/blob/master/README.md
// - http://www.browsersync.io/docs/gulp/
