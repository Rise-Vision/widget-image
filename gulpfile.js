/* jshint node: true */

(function () {
  "use strict";

  var bump = require("gulp-bump");
  var del = require("del");
  var factory = require("widget-tester").gulpTaskFactory;
  var gulp = require("gulp");
  var gutil = require("gulp-util");
  var htmlreplace = require("gulp-html-replace");
  var jshint = require("gulp-jshint");
  var minifyCSS = require("gulp-minify-css");
  var path = require("path");
  var rename = require("gulp-rename");
  var runSequence = require("run-sequence");
  var sourcemaps = require("gulp-sourcemaps");
  var uglify = require("gulp-uglify");
  var usemin = require("gulp-usemin");
  var wct = require("web-component-tester").gulp.init(gulp);

  var appJSFiles = [
      "src/**/*.js",
      "!./src/components/**/*"
    ],
    htmlFiles = [
      "./src/settings.html",
      "./src/widget.html"
    ];

  gulp.task("clean", function (cb) {
    del(["./dist/**"], cb);
  });

  gulp.task("config", function() {
    var env = process.env.NODE_ENV || "prod";
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

  gulp.task("lint", function() {
    return gulp.src(appJSFiles)
      .pipe(jshint())
      .pipe(jshint.reporter("jshint-stylish"))
      .pipe(jshint.reporter("fail"));
  });

  gulp.task("source", ["lint"], function () {
    return gulp.src(htmlFiles)
      .pipe(usemin({
        css: [sourcemaps.init(), minifyCSS(), sourcemaps.write()],
        js: [sourcemaps.init(), uglify(), sourcemaps.write()]
      }))
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
    return gulp.src("src/components/rv-common-style/dist/fonts/**/*")
      .pipe(gulp.dest("dist/fonts"));
  });

  gulp.task("i18n", function(cb) {
    return gulp.src(["src/components/rv-common-i18n/dist/locales/**/*"])
      .pipe(gulp.dest("dist/locales"));
  });

  gulp.task("rise-storage", function() {
    return gulp.src([
      "src/components/webcomponentsjs/webcomponents*.js",
      "src/components/underscore/underscore*.*",
      "src/components/rise-storage/rise-storage.html",
      "src/components/polymer/*.*{html,js}",
      "src/components/promise-polyfill/*.*{html,js}",
      "src/components/iron-ajax/iron-ajax.html",
      "src/components/iron-ajax/iron-request.html"
    ], {base: "./src/"})
      .pipe(gulp.dest("dist/"));
  });

  gulp.task("watch",function(){
    gulp.watch("./src/**/*", ["build"]);
  });

  gulp.task("webdriver_update", factory.webdriveUpdate());

  // e2e testing
  // Settings
  gulp.task("html:e2e:settings", factory.htmlE2E({
    e2eMockData: "../test/data/url.js"
  }));

  gulp.task("e2e:server:settings", ["config", "html:e2e:settings"], factory.testServer());

  gulp.task("test:e2e:settings:run", ["webdriver_update"], factory.testE2EAngular({
    testFiles: "test/e2e/settings.js"}
  ));

  gulp.task("test:e2e:settings", function(cb) {
    runSequence(["e2e:server:settings"], "test:e2e:settings:run", "e2e:server-close", cb);
  });

  // Widget
  gulp.task("html:e2e:widget", function () {
    return gulp.src("./src/widget.html")
      .pipe(htmlreplace({
        e2egadgets: "../node_modules/widget-tester/mocks/gadget-mocks.js",
        e2eMockData: ["../node_modules/sinon/pkg/sinon.js", "../node_modules/sinon/pkg/sinon-server-1.14.1.js",
          "../test/data/url.js"]
      }))
      .pipe(rename(function (path) {
        path.basename += "-url-e2e";
      }))
      .pipe(gulp.dest("./src/"));
  });

  gulp.task("e2e:server:widget", ["config", "html:e2e:widget"], factory.testServer());

  gulp.task("test:e2e:widget:run", factory.testE2E({
      testFiles: "test/e2e/widget-*.js"}
  ));

  gulp.task("test:e2e:widget", function(cb) {
    runSequence(["e2e:server:widget"], "test:e2e:widget:run", "e2e:server-close", cb);
  });

  gulp.task("e2e:server-close", factory.testServerClose());

  gulp.task("test:e2e", function(cb) {
    runSequence("test:e2e:settings", "test:e2e:widget", cb);
  });

  // Integration testing
  gulp.task("test:integration", function(cb) {
    runSequence("test:local", cb);
  });

  // Unit testing
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
      "src/components/component-subscription-status/dist/js/subscription-status.js",
      "src/config/test.js",
      "src/settings/settings-app.js",
      "src/settings/**/*.js",
      "test/unit/settings/**/*spec.js"]}
  ));

  gulp.task("test", function(cb) {
    runSequence("test:unit:settings", "test:e2e", "test:integration", cb);
  });

  gulp.task("build", function (cb) {
    runSequence(["clean", "config"], ["source", "fonts", "i18n", "rise-storage"], ["unminify"], cb);
  });

  gulp.task("default", function(cb) {
    runSequence("test", "build", cb);
  });
})();
