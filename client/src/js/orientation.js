import { toFixedNumber } from './helpers'
import { settings } from './settings'

export let orientation = null

export function orientationInit() {
  // If we can ask for permission, it means we are in front of iOS 13
  // In iOS 13, you need to request permission to access sensors
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response == 'granted') {
          // If allowed, hang the corresponding handler
          window.addEventListener('deviceorientation', onOrientation)
        }
      })
      .catch(console.error)
  }
  // Android || iOS 12
  else if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', onOrientation)
  }
  // Android without a gyroscope
  else {
    document.querySelector('#orientationSupported').innerHTML = 'Gyroscope is not supported.<br>Гироскоп не поддерживается.<br>'
  }

  // Absolute values on the beta and gamma axes
  let absBeta = null
  let absGamma = null

  function onOrientation(event) {
    absBeta = toFixedNumber(Math.abs(event.beta), 1)

    // Modify the gamma to make it from 0 to 180 (instead of -90 to 90)
    if (event.gamma < 90 && event.gamma > 0) {
      absGamma = toFixedNumber(180 - event.gamma, 1)
    } else {
      absGamma = Math.abs(toFixedNumber(event.gamma, 1))
    }

    // Right-handed mode
    // Invert the coordinates so that 0 is at the bottom and 180 is at the top
    if (settings.motion.semiSphere === 'left') absGamma = toFixedNumber(180 - absGamma, 1)

    // Controlling the semisphere
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
