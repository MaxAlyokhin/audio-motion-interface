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

  // Округлённые значения акселерометра
  let motionAlpha = 0
  let motionBeta = 0
  let motionGamma = 0

  // Максимальное значение акселерометра по трём осям
  let absoluteMotion = 0

  let previousAbsoluteMotion = 0

  // Маркер того, сработал ли датчик выше отсечки threshold
  let isMotion = false

  // HTML-элементы, где будут отображаться эти значения
  let alphaElement = document.querySelector('.motion__alpha')
  let betaElement = document.querySelector('.motion__beta')
  let gammaElement = document.querySelector('.motion__gamma')
  let maximumElement = document.querySelector('.motion__maximum')
  let intervalElement = document.querySelector('.motion__interval')
  let isMotionElement = document.querySelector('.motion__is-motion')

  // Функция вызывается по каждому событию движения
  function onMotion(event) {
    motionAlpha = event.acceleration.x.toFixed(1)
    motionBeta = event.acceleration.y.toFixed(1)
    motionGamma = event.acceleration.z.toFixed(1)

    // Здесь у нас сводятся все движения к наибыстрейшему
    // Также отсекаем отрицательные значения, т.к. нас интересует сам факт движения
    absoluteMotion = Math.max(
      Math.abs(motionAlpha),
      Math.abs(motionBeta),
      Math.abs(motionGamma)
    )

    // Здесь отсекаем часть событий ниже порога threshold
    if (absoluteMotion > settings.motion.threshold) {
      isMotion = true

      // Сравниваем с предыдущим значением и находим наибольшее
      previousAbsoluteMotion =
        absoluteMotion > previousAbsoluteMotion
          ? absoluteMotion
          : previousAbsoluteMotion

      // Заполняем отчёт
      alphaElement.innerText = motionAlpha
      betaElement.innerText = motionBeta
      gammaElement.innerText = motionGamma
      maximumElement.innerText = previousAbsoluteMotion
      intervalElement.innerText = event.interval
      isMotionElement.innerText = isMotion
      isMotionElement.classList.add('motion--yes')

      // Генерируем звук

      // TODO: сделать троттл-лимит, считать сколько сейчас играет дорожек

      // TODO: передавать объект с параметрами?
      sound(absoluteMotion)

      // TODO: сделать два режима: как сейчас по absoluteMotion и режим когда
      // к каждой оси вызывается свой sound(ось), куда передаётся соответствующий параметр
    } else {
      isMotion = false
      isMotionElement.innerText = isMotion
      isMotionElement.classList.remove('motion--yes')
    }
  }
}
