import { toFixedNumber } from './helpers'

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

  function onOrientation(event) {
    if (event.gamma < 90 && event.gamma > 0) {
      orientation = toFixedNumber(180 - event.gamma, 1)
    } else {
      orientation = Math.abs(toFixedNumber(event.gamma, 1))
    }
  }
}
