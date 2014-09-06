	var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
    camelize: true
});
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('jshint', function () {
	return gulp.src("app/angular/**/*.js")
		.pipe($.jshint().on('error', $.util.log))
		.pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('concat', function() {
	return gulp.src("app/angular/**/*.js")
		.pipe($.sourcemaps.init())
		.pipe($.concat('rs-auth.js').on('error', $.util.log))
		.pipe($.ngAnnotate({
            add: true
        }).on('error', $.util.log))
		.pipe($.wrap({ src: 'app/angular-wrap-template.txt'}))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('dist'))
});

gulp.task('minify', function() {
	return gulp.src("dist/rs-auth.js")
		.pipe($.uglify())
		.pipe($.rename('rs-auth.min.js'))
		.pipe(gulp.dest('dist'))
});

gulp.task('serve', function() {
	browserSync({
	  notify: false,
	  server: {
	  	baseDir: ["app","dist"],
	  }
	});

	gulp.watch(['app/**/*.html'], reload);
	gulp.watch(['app/angular/**/*.js'], ['jshint','concat',reload]);
});

gulp.task('build', function() {
 	runSequence('jshint',['concat','minify']);
});

gulp.task('default', [
	'jshint',
	'concat',
	'serve'
]);