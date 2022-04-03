import gulp from 'gulp'
import sass from 'gulp-sass' // Sass компиллятор
import sourcemaps from 'gulp-sourcemaps' // Sourcemaps
import autoprefixer from 'gulp-autoprefixer' // Автопрефиксер CSS
import imagemin from 'gulp-imagemin' // Компрессия изображений
import imageminPngquant from 'imagemin-pngquant' // Дополнение для .png
import rimraf from 'rimraf' // Удаление файлов
import concat from 'gulp-concat' // Конкатенация
import include from 'gulp-include' // Подключение шаблонов
import webpackStream from 'webpack-stream' // Сборка JS
import inject from 'gulp-inject' // Инжекция css и js в index.html
import hash from 'gulp-hash' // Добавляет хэш
import browserSync from 'browser-sync' // Сервер
import htmlmin from 'gulp-htmlmin' // Минификация html
import rsync from 'gulp-rsync' // ssh-доступ на сервер
import { exec } from 'child_process' // Для деплоя - позволяет запустить bash для gulp-rsync
import deploySettings from './deploySettings.js' // Настройки деплоя

const { src, dest, watch, series, parallel } = gulp
const { reload } = browserSync

// Здесь хранятся пути до всех файлов
const path = {
  // Брать исходники здесь:
  src: {
    html: 'src/html/*.html',
    sass: 'src/sass/**/*.sass',
    js: 'src/js/**/*.js',
    img: 'src/images/**/*.*',
    fonts: 'src/fonts/**/*.*',
    libs: 'src/libs/**/*.*',
    static: 'src/static/**/.htaccess',
  },
  // За изменением каких файлов мы хотим наблюдать:
  watch: {
    html: 'src/html/*.html',
    sass: 'src/sass/**/*.sass',
    js: 'src/js/**/*.js',
    img: 'src/images/**/*.*',
    fonts: 'src/fonts/**/*.*',
    libs: 'src/libs/**/*.*',
    static: 'src/static/**/.htaccess',
  },
  // Готовые после сборки файлы переносим сюда:
  dist: {
    html: 'dist/',
    css: 'dist/styles/',
    js: 'dist/scripts/',
    img: 'dist/img/',
    fonts: 'dist/fonts/',
    libs: 'dist/libs/',
  },
  clean: 'dist',
}

// Здесь настройки сервера
const config = {
  server: {
    baseDir: 'dist',
  },
  tunnel: false,
  host: 'localhost',
  port: 8001,
  logPrefix: 'DevServer',
  open: true, // Браузер автоматом открываем
}

// Сборка html
function html() {
  return (
    src(path.src.html) // Путь до исходных файлов в src
      .pipe(include()) // Собираем html из шаблонов
      // Инжектируем в index.html скрипты и стили
      .pipe(
        // Читаем имена файлов с хэшем
        inject(
          src(['./dist/libs/*.css', './dist/styles/*.css'], { read: false }),
          {
            addRootSlash: false, // Убираем слэш вначале
            // Убираем 'dist/', чтобы index.html всё нашёл
            transform: function (filePath) {
              return `<link rel="stylesheet" href="${filePath.replace(
                'dist/',
                ''
              )}"></link>`
            },
          }
        )
      )
      .pipe(
        // Читаем имена файлов с хэшем
        inject(
          src(['./dist/libs/*.js', './dist/scripts/main-*.js'], {
            read: false,
          }),

          {
            name: 'main',
            addRootSlash: false, // Убираем слэш вначале
            // Убираем 'dist/', чтобы index.html всё нашёл
            transform: function (filePath) {
              return `<script src="${filePath.replace('dist/', '')}"></script>`
            },
          }
        )
      )
      // .pipe(
      //   htmlmin({
      //     removeComments: true,
      //     collapseWhitespace: true,
      //     minifyCSS: true,
      //   })
      // )
      .pipe(dest(path.dist.html)) // Вывод готового в dist
      .pipe(reload({ stream: true }))
  ) // Обновляем сервер
}

// Сборка css
function style() {
  // Очищаем стили
  rimraf('./dist/styles/*.*', (error) => console.log(`Errors: ${error}`))
  return src([path.src.sass]) // Путь до исходных файлов в src
    .pipe(sourcemaps.init()) // Инициализируем sourcemaps
    .pipe(
      sass({
        // Параметры gulp-sass
        sourceMap: true, // sourcemaps включены
        errLogToConsole: true, // Пишем логи
        outputStyle: 'compressed', // Минифицируем
      })
    )
    .pipe(concat('style.css'))
    .pipe(
      autoprefixer({
        grid: true,
        overrideBrowserslist: ['last 10 versions'],
      })
    ) // Добавляем вендорные префиксы, настраивается также через package.json в browserlist
    .pipe(sourcemaps.write()) // Прописываем sourcemaps
    .pipe(hash()) // Добавляем хеш
    .pipe(dest(path.dist.css)) // Вывод готового в dist
    .pipe(reload({ stream: true })) // Обновляем сервер
}

// Сборка js
function js() {
  // Очищаем скрипты
  rimraf('./dist/scripts/*.*', (error) => console.log(`Errors: ${error}`))
  return (
    src([
      // Путь до исходных файлов в src в необходимом порядке
      'src/js/*.js',
      // 'src/js/main.js',
      // 'src/js/suspectDetectionLight.js',
    ])
      // Собираем
      .pipe(
        webpackStream({
          module: {
            rules: [
              {
                // use: {
                //   loader: 'babel-loader',
                //   options: {
                //     presets: ['@babel/preset-env'],
                //   },
                // },
              },
            ],
          },
          entry: {
            main: './src/js/main.js',
          },
          output: { filename: '[name]-[hash:8].js' },
          devtool: 'inline-source-map',
        })
      )
      .pipe(dest(path.dist.js)) // Вывод готового в dist
      .pipe(reload({ stream: true }))
  ) // Обновляем сервер
}

// Оптимизация изображений
function image() {
  return src(path.src.img) // Путь до исходных файлов в src
    .pipe(imagemin({ plugins: [imageminPngquant()] })) // Оптимизация изображений + плагин для png
    .pipe(dest(path.dist.img)) // Вывод готового в dist
    .pipe(reload({ stream: true })) // Обновляем сервер
}

// Перенос библиотек
// Они автоматически подключатся в head.html
function libs() {
  return src(path.src.libs) // Путь до исходных файлов в src
    .pipe(dest(path.dist.libs)) // Вывод готового в dist
    .pipe(reload({ stream: true })) // Обновляем сервер
}

// Шрифты (перенос из src в dist)
function fonts() {
  return src(path.src.fonts) // Вход
    .pipe(dest(path.dist.fonts)) // Выход
    .pipe(reload({ stream: true })) // Обновляем сервер
}

// Перенос статических файлов
function staticFiles() {
  return src(path.src.static) // Вход
    .pipe(dest(path.dist.html)) // Выход
    .pipe(reload({ stream: true })) // Обновляем сервер
}

// Очистка
function clean(cb) {
  rimraf(path.clean, cb)
}

// Отправляем файлы на сервер
// Работает только в подсистеме WSL
export function remoteSync() {
  return src('dist/**').pipe(rsync(deploySettings))
}

// Вызывает remoteSync() из-под bash
// export function deploy() {
//   return exec('bash -c "gulp remoteSync"', (error, stdout, stderr) => {
//     if (error) {
//       throw error
//     }
//     console.log(stdout)
//     console.log(stderr)
//   })
// }

// Команды:

// Собрать проект
export const build = series(
  clean,
  style,
  js,
  image,
  fonts,
  libs,
  html,
  staticFiles,
  remoteSync
)

export const deployoff = series(
  style,
  js,
  image,
  staticFiles,
  fonts,
  libs,
  html,
  function () {
    browserSync(config)
    watch(path.watch.html, series(html))
    watch(path.watch.sass, series(style, html))
    watch(path.watch.js, series(js, html))
    watch(path.watch.img, image)
    watch(path.watch.static, staticFiles)
    watch(path.watch.fonts, fonts)
    watch(path.watch.libs, series(libs, html))
  }
)

// По дефолту всё собираем и запускаем сервер
const _default = series(
  style,
  js,
  image,
  staticFiles,
  fonts,
  libs,
  html,
  remoteSync,
  function () {
    browserSync(config)
    watch(path.watch.html, series(html, remoteSync))
    watch(path.watch.sass, series(style, html, remoteSync))
    watch(path.watch.js, series(js, html, remoteSync))
    watch(path.watch.img, image, remoteSync)
    watch(path.watch.static, staticFiles, remoteSync)
    watch(path.watch.fonts, fonts, remoteSync)
    watch(path.watch.libs, series(libs, html, remoteSync))
  }
)

export { _default as default }
