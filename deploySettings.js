const deploySettings = {
  hostname: 'host1633567@serv18.hostland.ru', // Адрес случайно найден на хостинге в папке .ssh
  port: 1024, // У hostland специфичный порт
  root: 'dist/', // Откуда - Деплоим на сервер всё, что лежит в папке dist
  destination: 'stranno.su/htdocs/test/', // Куда
  include: ['*.htaccess'], // Includes files to deploy
  exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
  recursive: true,
  archive: true,
  silent: false,
  compress: true,
  incremental: true, // Отслеживанием изменения внутри файлов и качаем только изменённые
  clean: true, // Удаляем всё файлы, которые не находим локально
}

export default deploySettings
