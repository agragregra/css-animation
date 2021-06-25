var gulp           = require('gulp'),
		sass           = require('gulp-sass'),
		browserSync    = require('browser-sync'),
		concat         = require('gulp-concat'),
		uglify         = require('gulp-uglify'),
		cleanCSS       = require('gulp-clean-css'),
		rename         = require('gulp-rename'),
		del            = require('del'),
		imagemin       = require('gulp-imagemin'),
		cache          = require('gulp-cache'),
		autoprefixer   = require('gulp-autoprefixer'),
		ftp            = require('vinyl-ftp'),
		notify         = require("gulp-notify"),
		rsync          = require('gulp-rsync');

function browsersync() {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	})
}

// Скрипты проекта

function commonJs() {
	return gulp.src([
		'app/js/common.js',
		])
	.pipe(concat('common.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('app/js'))
}

function otherJs() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/js/common.min.js', // Всегда в конце
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Минимизировать весь js (на выбор)
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({stream: true}))
}

function styles() {
	return gulp.src('app/sass/**/*.sass')
	.pipe(sass({outputStyle: 'expand'}).on("error", notify.onError()))
	.pipe(rename({suffix: '.min', prefix : ''}))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleanCSS()) // Опционально, закомментировать при отладке
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream: true}))
};

function imageMin() {
	return gulp.src('app/img/**/*')
	.pipe(cache(imagemin()))
	.pipe(gulp.dest('dist/img'))
}

function buildAll() {

	gulp.src([ 'app/*.html', 'app/.*', ]).pipe(gulp.dest('dist'));
	gulp.src([ 'app/css/main.min.css', ]).pipe(gulp.dest('dist/css'));
	gulp.src([ 'app/js/scripts.min.js', ]).pipe(gulp.dest('dist/js'));
	return gulp.src([ 'app/fonts/**/*', ]).pipe(gulp.dest('dist/fonts'));

}

function deploy() {

	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10
	})

	var globs = [
	'dist/**',
	'dist/.htaccess',
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'))

}

function rsync() {
	return gulp.src('dist/**')
	.pipe(rsync({
		root: 'dist/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		archive: true,
		silent: false,
		compress: true
	}))
}

function startwatch() {
	gulp.watch('app/sass/**/*.sass', styles);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], gulp.series(commonJs, otherJs));
	gulp.watch('app/*.html', browserSync.reload);
}

function removedist() { return del('dist') }
function clearcache() { return cache.clearAll() }

exports.js = gulp.series(commonJs, otherJs);
exports.styles = styles;
exports.commonJs = commonJs;
exports.otherJs = otherJs;
exports.clearcache = clearcache;
exports.imageMin = imageMin;
exports.removedist = removedist;
exports.buildAll = buildAll;
exports.build = gulp.series(removedist, imageMin, styles, commonJs, otherJs, buildAll);
exports.default = gulp.parallel(styles, commonJs, otherJs, browsersync, startwatch);
