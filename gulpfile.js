/* jshint node: true */

(function () {
  "use strict";

  var babel = require("gulp-babel");
  var bower = require("gulp-bower");
  var bump = require("gulp-bump");
  var del = require("del");
  var eslint = require("gulp-eslint");
  var factory = require("widget-tester").gulpTaskFactory;
  var file = require("gulp-file");
  var gulp = require("gulp");
  var gulpif = require("gulp-if");
  var gutil = require("gulp-util");
  var minifyCSS = require("gulp-minify-css");
  var path = require("path");
  var rename = require("gulp-rename");
  var runSequence = require("run-sequence");
  var sourcemaps = require("gulp-sourcemaps");
  var uglify = require("gulp-uglify");
  var usemin = require("gulp-usemin");
  var wct = require("web-component-tester").gulp.init(gulp);
  var env = process.env.NODE_ENV || "prod";

  var appJSFiles = [
      "src/**/*.js",
      "test/**/*.js",
      "!./src/components/**/*",
      "!./src/common-modules/**/*"
    ],
    htmlFiles = [
      "./src/settings.html",
      "./src/widget.html"
    ],
    es6Modules = [
      "./node_modules/common-component/local-messaging.js",
      "./node_modules/common-component/player-local-storage.js",
      "./node_modules/common-component/player-local-storage-licensing.js",
      "./node_modules/common-component/rise-content-sentinel.js"
    ];

  gulp.task("clean", function (cb) {
    del(["./dist/**"], cb);
  });

  gulp.task("config", function() {
    gutil.log("Environment is", env);

    return gulp.src(["./src/config/" + env + ".js"])
      .pipe(rename("config.js"))
      .pipe(gulp.dest("./src/config"));
  });

  gulp.task("bump", function(){
    return gulp.src(["./package.json", "./bower.json"])
      .pipe(bump({type:"patch"}))
      .pipe(gulp.dest("./"));
  });

  gulp.task( "lint", function() {
    return gulp.src(appJSFiles)
      .pipe( eslint() )
      .pipe( eslint.format() )
      .pipe( eslint.failAfterError() );
  } );

  gulp.task("es6-modules", function() {
    return gulp.src(es6Modules)
      .pipe(babel({
        "plugins": ["transform-es2015-modules-umd"]
      }))
      .pipe(gulp.dest("src/common-modules/"));
  });

  gulp.task("source", ["lint"], function () {
    var isProd = (env === "prod");

    return gulp.src(htmlFiles)
      .pipe(gulpif(isProd,
        // Minify for production.
        usemin({
          css: [sourcemaps.init(), minifyCSS(), sourcemaps.write()],
          js: [sourcemaps.init(), uglify(), sourcemaps.write()]
        }),
        // Don't minify for staging.
        usemin({})
      ))
      .pipe(gulp.dest("dist/"));
  });

  gulp.task("unminify", function () {
    return gulp.src(htmlFiles)
      .pipe(usemin({
        css: [rename(function (path) {
          path.basename = path.basename.substring(0, path.basename.indexOf(".min"))
        }), gulp.dest("dist")],
        js: [rename(function (path) {
          path.basename = path.basename.substring(0, path.basename.indexOf(".min"))
        }), gulp.dest("dist")]
      }))
  });

  gulp.task("fonts", function() {
    return gulp.src("src/components/common-header/dist/fonts/**/*")
      .pipe(gulp.dest("dist/fonts"));
  });

  gulp.task("i18n", function(cb) {
    return gulp.src(["src/components/common-header/dist/locales/**/*"])
      .pipe(gulp.dest("dist/locales"));
  });

  gulp.task("rise-storage", function() {
    return gulp.src([
      "src/components/webcomponentsjs/webcomponents*.js",
      "src/components/underscore/underscore*.*",
      "src/components/rise-storage/rise-storage.html",
      "src/components/rise-storage-v2/rise-storage.html",
      "src/components/rise-logger/rise-logger.html",
      "src/components/rise-logger/rise-logger-utils.html",
      "src/components/polymer/*.*{html,js}",
      "src/components/promise-polyfill/*.*{html,js}",
      "src/components/iron-ajax/iron-ajax.html",
      "src/components/iron-ajax/iron-request.html"
    ], {base: "./src/"})
      .pipe(gulp.dest("dist/"));
  });

  gulp.task("version", function () {
    var pkg = require("./package.json"),
      str = '/* exported version */\n' +
        'var version = "' + pkg.version + '";';

    return file("version.js", str, {src: true})
      .pipe(gulp.dest("./src/config/"));
  });

  gulp.task("watch",function(){
    gulp.watch("./src/**/*", ["build"]);
  });

  gulp.task("webdriver_update", factory.webdriveUpdate());

  // ***** e2e Testing ***** //

  gulp.task("html:e2e:settings", factory.htmlE2E());

  gulp.task("e2e:server:settings", ["config", "html:e2e:settings"], factory.testServer());

  gulp.task("test:e2e:settings:run", ["webdriver_update"], factory.testE2EAngular({
    testFiles: "test/e2e/settings.js"}
  ));

  gulp.task("test:e2e:settings", function(cb) {
    runSequence(["e2e:server:settings"], "test:e2e:settings:run", "e2e:server-close", cb);
  });

  gulp.task("e2e:server-close", factory.testServerClose());

  gulp.task("test:e2e", function(cb) {
    runSequence("test:e2e:settings", cb);
  });

  // Integration testing
  gulp.task("test:integration", function(cb) {
    runSequence("test:local", cb);
  });

  // ****** Unit Testing ***** //
  gulp.task("test:unit:settings", factory.testUnitAngular(
    {testFiles: [
      "src/components/jquery/dist/jquery.js",
      "src/components/angular/angular.js",
      "src/components/angular-mocks/angular-mocks.js",
      "src/components/angular-sanitize/angular-sanitize.js",
      "src/components/angular-translate/angular-translate.js",
      "src/components/angular-translate-loader-static-files/angular-translate-loader-static-files.js",
      "node_modules/widget-tester/mocks/common-mock.js",
      "src/components/angular-bootstrap/ui-bootstrap-tpls.js",
      "src/components/widget-settings-ui-components/dist/js/**/*.js",
      "src/components/widget-settings-ui-core/dist/*.js",
      "src/components/component-storage-selector/dist/storage-selector.js",
      "src/components/common-header/dist/js/components/subscription-status.js",
      "src/config/version.js",
      "src/config/test.js",
      "src/settings/settings-app.js",
      "src/settings/**/*.js",
      "test/unit/settings/**/*spec.js"]}
  ));

  gulp.task("test:unit:widget", factory.testUnitAngular(
    {testFiles: [
      "node_modules/widget-tester/mocks/gadget-mocks.js",
      "node_modules/widget-tester/mocks/logger-mock.js",
      "src/components/widget-common/dist/config.js",
      "src/config/config.js",
      "src/widget/image-utils.js",
      "test/unit/image-utils-spec.js"
    ]}
  ));

  gulp.task("test:unit", function(cb) {
    runSequence("test:unit:settings", "test:unit:widget", cb);
  });

  gulp.task("test", function(cb) {
    runSequence("version", "es6-modules", "test:unit", "test:e2e", "test:integration", cb);
  });

  gulp.task("bower-update", function (cb) {
    return bower({ cmd: "update"}).on("error", function(err) {
      console.log(err);
      cb();
    });
  });

  gulp.task("build-dev", function (cb) {
    runSequence(["clean", "config", "version"], ["es6-modules", "source", "fonts", "i18n", "rise-storage"], ["unminify"], cb);
  });

  gulp.task("build", function (cb) {
    runSequence(["clean", "config", "bower-update", "version"], ["es6-modules", "source", "fonts", "i18n", "rise-storage"], ["unminify"], cb);
  });

  gulp.task("default", function(cb) {
    runSequence("test", "build", cb);
  });
})();
