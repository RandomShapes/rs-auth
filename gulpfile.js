var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
    camelize: true
});
var runSequence = require('run-sequence');

var jsSources = [
	'angular/rs-auth-module.js',
	'angular/rs-auth-config.js',
	'angular/rs-auth-local.js',
	'angular/rs-auth-provider.js',
	'angular/rs-auth-run.js'
]

gulp.task('jshint', function () {
  return gulp.src(jsSources)
      .pipe($.jshint().on('error', $.util.log))
      .pipe($.jshint.reporter('jshint-stylish'))
});

gulp.task('concat',function() {
	return gulp.src(jsSources)
		.pipe($.concat('rs-auth.js').on('error', $.util.log))
		.pipe(gulp.dest('./dist/'))
});

gulp.task('minify', function() {
	return gulp.src(jsSources)
		.pipe($.concat('rs-auth.min.js').on('error', $.util.log))
		.pipe($.uglify().on('error', $.util.log))
		.pipe(gulp.dest('./dist/'))
});

gulp.task('build', function() {
  runSequence('jshint',['concat','minify']);
});

gulp.task('default', [
  'build'
]);