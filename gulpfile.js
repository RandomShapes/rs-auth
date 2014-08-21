var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
    camelize: true
});
var runSequence = require('run-sequence');

var jsSources = [
	'angular/rs-auth-module.js',
	'angular/rs-auth-constant.js',
	'angular/rs-auth-session-provider.js',
	'angular/rs-auth-provider.js',
	'angular/rs-auth-run.js',
]

gulp.task('jshint', function () {
  return gulp.src(jsSources)
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
});

gulp.task('concat',function() {
	return gulp.src(jsSources)
		.pipe($.concat('rs-auth.js'))
		.pipe(gulp.dest('./dist/'))
});

gulp.task('minify', function() {
	return gulp.src(jsSources)
		.pipe($.concat('rs-auth.min.js'))
		.pipe($.uglify())
		.pipe(gulp.dest('./dist/'))
});

gulp.task('build', function() {
  runSequence('jshint',['concat','minify']);
});

gulp.task('default', [
  'build'
]);