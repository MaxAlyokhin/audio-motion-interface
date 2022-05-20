// Модуль:
// - определяет наличие датчиков
// - инициализирует объект движения
// - вешает обработчик onMotion() на события движения

// onMotion():
// - генерирует объект движения по каждому событию движения
// - определяет, отдавать ли объект движения в вебсокет или отдавать его в обработчик аудио

import { audio } from './audio'
import { toFixedNumber } from './helpers'
import { orientation, orientationInit } from './orientation'
import { settings, settingsInit } from './settings'
import { socket, socketInit } from './websocket'

export function motionInit() {
  // Проверяем наличие акселерометра на устройстве
  // iOS 13
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
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
    document.querySelector('#motionSupported').innerHTML =
      'Error: accelerometer is not supported.<br>Ошибка: акселерометр не поддерживается.<br>'
  }

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

  // HTML-элементы, где будут отображаться эти значения
  let alphaElement = null
  let betaElement = null
  let gammaElement = null
  let maximumElement = null
  let intervalElement = null
  let isMotionElement = null
  let orientationElement = null

  let connectionsToServer = document.querySelector('.connections__to-server')
  let connectionsStatus = document.querySelector('.connections__status')

  // По первому событию движения мы можем однозначно определить
  // в смартфоне мы находимся или на десктопе (event.acceleration === null)
  // Изначально мы не знаем, где находимся
  let isDesktop = undefined
  let receiverRegimeIsInit = false

  // Функция вызывается по каждому событию движения
  function onMotion(event) {
    // Если датчика нет, то режим приёмника (десктоп-режим)
    if (event.acceleration.x === null && receiverRegimeIsInit === false) {
      // Включаем фронтэнд для десктопа
      document.querySelector('.frontendDesktop').style.display = 'block'

      alphaElement = document.querySelector('.frontendDesktop .motion__alpha')
      betaElement = document.querySelector('.frontendDesktop .motion__beta')
      gammaElement = document.querySelector('.frontendDesktop .motion__gamma')
      maximumElement = document.querySelector('.frontendDesktop .motion__maximum')
      intervalElement = document.querySelector('.frontendDesktop .motion__interval')
      isMotionElement = document.querySelector('.frontendDesktop .motion__is-motion')
      orientationElement = document.querySelector('.frontendDesktop .motion__orientation')

      // Включаем сокет, чтобы слушать внешние события движения
      socketInit()

      socket.connect()

      // Вешаем слушатели вебсокет-событий
      socket.on('connect', () => {
        connectionsToServer.innerText = 'Связь с вебсокет-сервером установлена'
        connectionsToServer.classList.remove('connections--wait', 'connections--error')
        connectionsToServer.classList.add('connections--ready')
      })

      socket.on('disconnect', () => {
        connectionsToServer.innerText = 'Связь с вебсокет-сервером потеряна'
        connectionsToServer.classList.remove('connections--wait', 'connections--ready')
        connectionsToServer.classList.add('connections--error')
      })

      socket.on('connection message', (clientsSize) => {
        // Если остались только мы сами
        if (clientsSize === 1) {
          connectionsStatus.innerText = `Ожидание подключений...`
          connectionsStatus.classList.remove('connections--ready')
          connectionsStatus.classList.add('connections--wait')
        }
        if (clientsSize > 1) {
          // Минус наше устройство
          connectionsStatus.innerText = `Подключено (${clientsSize - 1})`
          connectionsStatus.classList.remove('connections--wait')
          connectionsStatus.classList.add('connections--ready')

          // console.log(socket.request.headers);
        }
      })

      // По обновлению объекта движения
      socket.on('motion message', (motion) => {
        isMotionElement.innerText = motion.isMotion

        if (motion.isMotion && motion.maximum > settings.motion.threshold) {
          alphaElement.innerText = motion.alpha
          betaElement.innerText = motion.beta
          gammaElement.innerText = motion.gamma
          maximumElement.innerText = motion.maximumOnSession
          orientationElement.innerText = motion.orientation

          isMotionElement.classList.add('motion--yes')
        } else {
          isMotionElement.classList.remove('motion--yes')
        }

        audio(motion)
      })
      // По обновлению объекта настроек
      socket.on('settings message', (settingsData) => {
        Object.assign(settings, settingsData)
      })

      isDesktop = true
      receiverRegimeIsInit = true
    }
    // Датчик есть (смартфон-режим)
    else if (receiverRegimeIsInit === false) {
      // Включаем фронтэнд для смартфона
      document.querySelector('.frontendMobile').style.display = 'block'

      alphaElement = document.querySelector('.frontendMobile .motion__alpha')
      betaElement = document.querySelector('.frontendMobile .motion__beta')
      gammaElement = document.querySelector('.frontendMobile .motion__gamma')
      maximumElement = document.querySelector('.frontendMobile .motion__maximum')
      intervalElement = document.querySelector('.frontendMobile .motion__interval')
      isMotionElement = document.querySelector('.frontendMobile .motion__is-motion')
      orientationElement = document.querySelector('.frontendMobile .motion__orientation')

      // Инициализируем объект настроек и слушатели событий интерфейса
      settingsInit()

      // Включаем гироскоп
      orientationInit()

      isDesktop = false
      receiverRegimeIsInit = true
    }

    if (!isDesktop) {
      motion.alpha = Math.abs(toFixedNumber(event.acceleration.x, 1))
      motion.beta = Math.abs(toFixedNumber(event.acceleration.y, 1))
      motion.gamma = Math.abs(toFixedNumber(event.acceleration.z, 1))

      // Здесь у нас сводятся все движения к наибыстрейшему
      // Также отсекаем отрицательные значения, т.к. нас интересует сам факт движения
      motion.maximum = Math.max(motion.alpha, motion.beta, motion.gamma)

      // Здесь отсекаем часть событий ниже порога threshold
      if (motion.maximum > settings.motion.threshold) {
        motion.isMotion = true

        // Сравниваем с предыдущим значением и находим наибольшее
        previousMaximumMotion = motion.maximum > previousMaximumMotion ? motion.maximum : previousMaximumMotion

        motion.maximumOnSession = previousMaximumMotion

        motion.orientation = orientation

        // Заполняем отчёт
        alphaElement.innerText = motion.alpha
        betaElement.innerText = motion.beta
        gammaElement.innerText = motion.gamma
        maximumElement.innerText = previousMaximumMotion
        intervalElement.innerText = event.interval
        isMotionElement.innerText = motion.isMotion
        isMotionElement.classList.add('motion--yes')
        orientationElement.innerText = motion.orientation

        // Генерируем звук на смартфоне
        if (settings.audio.synthesisRegime === 'local') {
          audio(motion)
        }
        // Либо отдаём в вебсокет для десктопа
        if (settings.audio.synthesisRegime === 'remote') {
          socket.emit('motion message', motion)
        }
      } else {
        motion.isMotion = false
        isMotionElement.innerText = motion.isMotion
        isMotionElement.classList.remove('motion--yes')

        // Здесь тоже вызываем с isMotion = false, чтобы закончить работу осциллятора
        if (settings.audio.synthesisRegime === 'local') {
          audio(motion)
        }
        if (settings.audio.synthesisRegime === 'remote') {
          socket.emit('motion message', motion)
        }
      }
    }
  }
}
