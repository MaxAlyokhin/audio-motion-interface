import { sound } from './sound'
import { settings } from './settings'

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
    isMotion: false, // Маркер того, сработал ли датчик выше отсечки threshold
  }

  let previousMaximumMotion = 0

  // HTML-элементы, где будут отображаться эти значения
  let alphaElement = document.querySelector('.motion__alpha')
  let betaElement = document.querySelector('.motion__beta')
  let gammaElement = document.querySelector('.motion__gamma')
  let maximumElement = document.querySelector('.motion__maximum')
  let intervalElement = document.querySelector('.motion__interval')
  let isMotionElement = document.querySelector('.motion__is-motion')

  // Функция вызывается по каждому событию движения
  function onMotion(event) {
    motion.alpha = Math.abs(event.acceleration.x.toFixed(1))
    motion.beta = Math.abs(event.acceleration.y.toFixed(1))
    motion.gamma = Math.abs(event.acceleration.z.toFixed(1))

    // Здесь у нас сводятся все движения к наибыстрейшему
    // Также отсекаем отрицательные значения, т.к. нас интересует сам факт движения
    motion.maximum = Math.max(motion.alpha, motion.beta, motion.gamma)

    // Здесь отсекаем часть событий ниже порога threshold
    if (motion.maximum > settings.motion.threshold) {
      motion.isMotion = true

      // Сравниваем с предыдущим значением и находим наибольшее
      previousMaximumMotion = motion.maximum > previousMaximumMotion ? motion.maximum : previousMaximumMotion

      // Заполняем отчёт
      alphaElement.innerText = motion.alpha
      betaElement.innerText = motion.beta
      gammaElement.innerText = motion.gamma
      maximumElement.innerText = previousMaximumMotion
      intervalElement.innerText = event.interval
      isMotionElement.innerText = motion.isMotion
      isMotionElement.classList.add('motion--yes')

      // Генерируем звук

      // TODO: сделать троттл-лимит, считать сколько сейчас играет дорожек
      // TODO: тоны должны генериться не чаще 1 в 50мс

      sound(motion)
    } else {
      motion.isMotion = false
      isMotionElement.innerText = motion.isMotion
      isMotionElement.classList.remove('motion--yes')

      // Здесь тоже вызываем с isMotion = false, чтобы закончить работу осциллятора
      sound(motion)
    }
  }
}

// TODO: юзать ли отрицательные числа
