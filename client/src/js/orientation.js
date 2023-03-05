import { toFixedNumber } from './helpers'
import { settings } from './settings'

export let orientation = null

export function orientationInit() {
  // Если можем запросить разрешение - значит перед нами iOS 13
  // В iOS 13 необходимо запрашивать разрешение на доступ к датчикам
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response == 'granted') {
          // Если разрешили, то вешаем соответствующий обработчик
          window.addEventListener('deviceorientation', onOrientation)
        }
      })
      .catch(console.error)
  }
  // Android || iOS 12
  else if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', onOrientation)
  }
  // Android без гироскопа
  else {
    document.querySelector('#orientationSupported').innerHTML = 'Gyroscope is not supported.<br>Гироскоп не поддерживается.<br>'
  }

  // Абсолютные значения по осям бета и гамма
  let absBeta = null
  let absGamma = null

  function onOrientation(event) {
    absBeta = toFixedNumber(Math.abs(event.beta), 1)

    // Модифицируем гамму так, чтобы получилось от 0 до 180 (вместо -90 - 90)
    if (event.gamma < 90 && event.gamma > 0) {
      absGamma = toFixedNumber(180 - event.gamma, 1)
    } else {
      absGamma = Math.abs(toFixedNumber(event.gamma, 1))
    }

    // Режим правши
    // Инвертируем координаты, чтобы 0 был внизу, а 180 вверху
    if (settings.motion.semiSphere === 'left') absGamma = toFixedNumber(180 - absGamma, 1)

    // Контролируем полусферу
    if (
      (absGamma >= 90 && absBeta < 90) ||
      (absGamma === 90 && absBeta > 90) ||
      (absGamma < 90 && absBeta >= 90)
    ) {
      orientation = absGamma
    } else {
      orientation = false
    }
  }
}
