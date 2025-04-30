import gulp from 'gulp';
import prettier from 'gulp-prettier';
import eslint from 'gulp-eslint';
import clean from 'gulp-clean';
import concat from 'gulp-concat';
import dartSass from 'sass'; // Import dart-sass
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass); // Use dart-sass with gulp-sass
import stylelint from 'gulp-stylelint';

const paths = {
  src: 'src',
  dist: 'dist',
  img: 'src/img/**/*',
  scripts: 'src/scripts/**/*.js',
  styles: 'src/styles/**/*.scss',
  html: 'src/**/*.html',
};

// Clean the dist folder
function cleanDist() {
  return gulp.src(paths.dist, { allowEmpty: true }).pipe(clean());
}

// Copy images, styleguide, and templates
function copyAssets() {
  return gulp.src([paths.img], { base: paths.src }).pipe(gulp.dest(paths.dist));
}

// Process and lint JavaScript
function processScripts() {
  return gulp
    .src(paths.scripts)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(prettier())
    .pipe(gulp.dest(`${paths.dist}/scripts`));
}

// Process, lint, and format CSS (using Sass)
function processStyles() {
  return gulp
    .src(paths.styles)
    .pipe(
      stylelint({
        reporters: [{ formatter: 'string', console: true }],
      }),
    )
    .pipe(prettier())
    .pipe(gulp.dest(`${paths.dist}/styles`));
}

// Process HTML (Prettier only)
function processHtml() {
  return gulp.src(paths.html).pipe(prettier()).pipe(gulp.dest(paths.dist));
}

// Watch files for changes and reload the browser
function watchFiles() {
  gulp.watch(paths.img, copyAssets);
  gulp.watch(paths.scripts, processScripts);
  gulp.watch(paths.styles, processStyles);
  gulp.watch(paths.html, processHtml);

  bs.init({
    server: {
      baseDir: paths.dist,
    },
  });

  gulp.watch(`${paths.dist}/**/*`);
}

// Define the default Gulp task
const build = gulp.series(
  cleanDist,
  gulp.parallel(copyAssets, processScripts, processStyles, processHtml),
);
const watch = gulp.series(build, watchFiles);

export default build; // Export the default task
export { watch }; // Export the watch task
