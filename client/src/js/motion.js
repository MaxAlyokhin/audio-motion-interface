// Модуль:
// - определяет наличие датчиков
// - инициализирует объект движения
// - вешает обработчик onMotion() на события движения

// onMotion():
// - генерирует объект движения по каждому событию движения
// - определяет, отдавать ли объект движения в вебсокет или отдавать его в обработчик аудио

import QRious from 'qrious'
import fscreen from 'fscreen'
import device from 'current-device'

import { audio } from './audio'
import { toFixedNumber } from './helpers'
import { orientation, orientationInit } from './orientation'
import { settings, settingsInit, syncSettingsFrontend } from './settings'
import { socket, socketInit } from './websocket'
import { language } from './language'

export function motionInit() {

  // Инициализируем объект движения
  let motion = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    maximum: 0, // Максимальное значение акселерометра по трём осям
    maximumOnSession: 0,
    isMotion: false, // Маркер того, сработал ли датчик выше отсечки threshold
    orientation: 0,
  }

  let previousMaximumMotion = 0
  let previousOrientation = null
  let previousIsMotion = null

  // HTML-элементы, где будут отображаться эти значения
  const motionElement = document.querySelector('.motion')
  const alphaElement = document.querySelector('.motion__alpha')
  const betaElement = document.querySelector('.motion__beta')
  const gammaElement = document.querySelector('.motion__gamma')
  const maximumElement = document.querySelector('.motion__maximum')
  const isMotionElement = document.querySelector('.motion__is-motion')
  const orientationElement = document.querySelector('.motion__orientation')
  const connectionsToServer = document.querySelector('.connections__to-server')
  const connectionsStatus = document.querySelector('.connections__status')
  const qrElement = document.querySelector('.qr')
  const rootElement = document.querySelector('html')

  // По первому событию движения мы можем однозначно определить
  // в смартфоне мы находимся или на десктопе (event.acceleration === null)
  // Изначально мы не знаем, где находимся
  let receiverRegimeIsInit = false

  // Fullscreen маркер
  let fullscreenIsOn = false

  // Функция вызывается по каждому событию движения
  function onMotion(event) {
    if (receiverRegimeIsInit === false) {
      // Включаем фронтэнд для смартфона
      document.querySelectorAll('.desktop').forEach((element) => {
        element.style.display = 'none'
      })
      document.querySelector('.container').classList.add('mobile')

      if (fscreen.fullscreenEnabled) {
        document.querySelector('.title__fullscreen').addEventListener('click', () => {
          if (fullscreenIsOn) {
            fscreen.exitFullscreen()
            fullscreenIsOn = false
          } else {
            fscreen.requestFullscreen(rootElement)
            fullscreenIsOn = true
          }
        })
      } else {
        // Если фуллскрин не поддерживается, то убираем кнопку
        document.querySelector('.title__fullscreen').style.display = 'none'
      }

      // Включаем гироскоп
      orientationInit()

      receiverRegimeIsInit = true
    }

    motion.alpha = Math.abs(toFixedNumber(event.acceleration.x, 1))
    motion.beta = Math.abs(toFixedNumber(event.acceleration.y, 1))
    motion.gamma = Math.abs(toFixedNumber(event.acceleration.z, 1))

    // Здесь у нас сводятся все движения к наибыстрейшему
    // Также отсекаем отрицательные значения, т.к. нас интересует сам факт движения
    motion.maximum = Math.max(motion.alpha, motion.beta, motion.gamma)

    motion.orientation = orientation
    // Обновляем DOM только при изменении значения
    if (previousOrientation !== motion.orientation && motion.orientation !== false) {
      settings.ui.lite ? false : (orientationElement.textContent = motion.orientation)
      previousOrientation = motion.orientation
    }

    // Здесь отсекаем часть событий ниже порога threshold
    if (motion.maximum >= settings.motion.threshold && motion.orientation !== false) {
      motion.isMotion = true

      // Сравниваем с предыдущим значением и находим наибольшее
      previousMaximumMotion = motion.maximum > previousMaximumMotion ? motion.maximum : previousMaximumMotion

      motion.maximumOnSession = previousMaximumMotion

      if (previousIsMotion !== motion.isMotion) {
        settings.ui.lite ? false : (isMotionElement.textContent = motion.isMotion)
        previousIsMotion = motion.isMotion
      }

      if (!settings.ui.lite) {
        alphaElement.textContent = motion.alpha
        betaElement.textContent = motion.beta
        gammaElement.textContent = motion.gamma
        maximumElement.textContent = previousMaximumMotion
        isMotionElement.classList.add('motion--yes')
      }

      // Генерируем звук на смартфоне
      if (settings.audio.synthesisRegime === 'local') {
        audio(motion)
      }
      // Либо отдаём в вебсокет для десктопа
      if (settings.audio.synthesisRegime === 'remote') {
        audio(motion)
        socket.emit('motion message', motion)
      }
    } else {
      motion.isMotion = false
      if (previousIsMotion !== motion.isMotion) {
        settings.ui.lite ? false : (isMotionElement.textContent = motion.isMotion)
        previousIsMotion = motion.isMotion
      }
      isMotionElement.classList.remove('motion--yes')

      // Здесь тоже вызываем с isMotion = false, чтобы закончить работу осциллятора
      if (settings.audio.synthesisRegime === 'local') {
        audio(motion)
      }
      if (settings.audio.synthesisRegime === 'remote') {
        audio(motion)
        socket.emit('motion message', motion)
      }
    }
  }

  if (device.desktop()) {
    // Фронтэнд для десктопа
    document.querySelectorAll('.mobile').forEach((element) => {
      element.style.display = 'none'
    })
    document.querySelector('.info').style.display = 'block'

    // Генерируем QR-код для попапа
    fetch(`/hostname`)
      .then((response) => {
        if (response.status !== 200) {
          document.querySelector('.errors').innerHTML += `Error while loading data from server.<br>Status: ${response.status}`
          return
        }

        // Если всё в порядке, то парсим ответ
        response.text().then((data) => {
          new QRious({
            element: document.querySelector('.qr__code'),
            value: `https://${data}?remote`,
            backgroundAlpha: 0,
            size: 300,
          })

          const qrText = document.querySelector('.qr__text span')
          qrText.textContent = `https://${data}?remote`
          qrText.href = `https://${data}?remote`
        })
      })
      .catch((error) => {
        throw new Error('Server connection error. Check the Internet connection.')
      })

    // Вешаем обработчик на кнопку показа попапа с QR-кодом
    document.querySelector('.title__qr').addEventListener('click', () => {
      qrElement.classList.toggle('qr--show')
    })

    // Включаем сокет, чтобы слушать внешние события движения
    socketInit()

    socket.connect()

    // Вешаем слушатели вебсокет-событий
    socket.on('connect', () => {
      connectionsToServer.textContent = language.connection.ready
      connectionsToServer.classList.remove('connections--wait', 'connections--error')
      connectionsToServer.classList.add('connections--ready')
    })

    socket.on('disconnect', () => {
      connectionsToServer.textContent = language.connection.failed
      connectionsToServer.classList.remove('connections--wait', 'connections--ready')
      connectionsToServer.classList.add('connections--error')
    })

    socket.on('connection message', (clientsSize) => {
      // Если остались только мы сами
      if (clientsSize === 1) {
        connectionsStatus.textContent = language.connection.waiting
        connectionsStatus.classList.remove('connections--ready')
        connectionsStatus.classList.add('connections--wait')
        motionElement.classList.add('inactive')
        qrElement.classList.add('qr--show')
      }
      if (clientsSize > 1) {
        // Минус наше устройство
        connectionsStatus.textContent = `${language.connection.connected} (${clientsSize - 1})`
        connectionsStatus.classList.remove('connections--wait')
        connectionsStatus.classList.add('connections--ready')
        motionElement.classList.remove('inactive')
        qrElement.classList.remove('qr--show')

        // При подключении смартфона к десктопу настройки десктопа переписывают настройки смартфона
        settings.audio.synthesisRegime = 'remote'
        socket.emit('settings message', settings)
      }
    })

    // По обновлению объекта движения
    socket.on('motion message', (motion) => {
      // Обновляем DOM только при изменении значения
      if (previousIsMotion !== motion.isMotion) {
        settings.ui.lite ? false : (isMotionElement.textContent = motion.isMotion)
        previousIsMotion = motion.isMotion
      }

      if (previousOrientation !== motion.orientation && motion.orientation !== false) {
        settings.ui.lite ? false : (orientationElement.textContent = motion.orientation)
        previousOrientation = motion.orientation
      }

      if (motion.isMotion && motion.maximum > settings.motion.threshold) {
        if (!settings.ui.lite) {
          alphaElement.textContent = motion.alpha
          betaElement.textContent = motion.beta
          gammaElement.textContent = motion.gamma
          maximumElement.textContent = motion.maximumOnSession
          isMotionElement.classList.add('motion--yes')
        }
      } else {
        isMotionElement.classList.remove('motion--yes')
      }

      audio(motion)
    })
    // По обновлению объекта настроек
    socket.on('settings message', (settingsData) => {
      Object.assign(settings, settingsData) // Обновляем объект
      syncSettingsFrontend(settingsData) // Обновляем input-поля
    })

    // isDesktop = true
    receiverRegimeIsInit = true

  } else if (device.mobile()) {
    // Проверяем наличие акселерометра на устройстве
    // iOS 13
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((response) => {
          if (response == 'granted') {
            // Если разрешили, то вешаем соответствующий обработчик
            window.addEventListener('devicemotion', onMotion)
          }
        })
        .catch(console.error)
    }
    // iOS 12 и Android
    else if ('ondevicemotion' in window) {
      window.addEventListener('devicemotion', onMotion)
    }
    // Нет акселерометра
    else {
      document.querySelector('#motionSupported').innerHTML = 'Error: accelerometer is not supported.<br>Ошибка: акселерометр не поддерживается.<br>'
    }
  }

  settingsInit()
}
