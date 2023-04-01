// This module:
// - detects the availability of sensors
// - initializes the motion object
// - hangs the onMotion() handler on motion events

// onMotion():
// - generates a motion object for each motion event
// - determines whether to give the motion object to the websocket or to give it to the audio handler

import QRious from 'qrious'
import fscreen from 'fscreen'
import device from 'current-device'

import { audio } from './audio'
import { toFixedNumber } from './helpers'
import { orientation, orientationInit } from './orientation'
import { settings, settingsInit, syncSettingsFrontend } from './settings'
import { socket, socketInit, socketIsInit } from './websocket'
import { language } from './language'
import { latency } from './latency'

export let clientsCount = null // Number of connections

export function motionInit() {

  // Initializing a motion object
  let motion = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    maximum: 0, // Maximum value of accelerometer on three axes
    maximumOnSession: 0,
    isMotion: false, // A flag of whether the sensor is triggered above the cutoff
    orientation: 0,
  }

  let previousMaximumMotion = 0
  let previousOrientation = null
  let previousIsMotion = null

  // HTML elements where these values will be displayed
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

  // From the first motion event we can unambiguously determine
  // in the smartphone or on the desktop we are (event.acceleration === null)
  // Initially, we don't know where we are
  let receiverRegimeIsInit = false

  // Fullscreen flag
  let fullscreenIsOn = false

  // The function is called for each motion event
  function onMotion(event) {
    if (receiverRegimeIsInit === false) {
      // Switching on the frontend for the smartphone
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
        // If fullscreen is not supported, remove the button
        document.querySelector('.title__fullscreen').style.display = 'none'
      }

      // Turning on the gyroscope
      orientationInit()

      receiverRegimeIsInit = true
    }

    motion.alpha = Math.abs(toFixedNumber(event.acceleration.x, 1))
    motion.beta = Math.abs(toFixedNumber(event.acceleration.y, 1))
    motion.gamma = Math.abs(toFixedNumber(event.acceleration.z, 1))

    // Here we have all the movements reduced to the fastest
    // We also discard negative values, since we are interested in the fact of movement
    motion.maximum = Math.max(motion.alpha, motion.beta, motion.gamma)

    motion.orientation = orientation
    // Update the DOM only when the value changes
    if (previousOrientation !== motion.orientation && motion.orientation !== false) {
      settings.ui.lite ? false : (orientationElement.textContent = motion.orientation)
      previousOrientation = motion.orientation
    }

    // Here we discard the part of events below the threshold
    if (motion.maximum >= settings.motion.threshold && motion.orientation !== false) {
      motion.isMotion = true

      // We compare with the previous value and find the largest
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

      // Generating sound on a smartphone
      if (settings.audio.synthesisRegime === 'local') {
        audio(motion)
      }
      // Or we give it to a websocket for the desktop
      if (settings.audio.synthesisRegime === 'remote') {
        audio(motion)
        if (socketIsInit) {
          socket.emit('motion message', motion)
        }
      }
    } else {
      motion.isMotion = false
      if (previousIsMotion !== motion.isMotion) {
        settings.ui.lite ? false : (isMotionElement.textContent = motion.isMotion)
        previousIsMotion = motion.isMotion
      }
      isMotionElement.classList.remove('motion--yes')

      // Here, too, we call with isMotion = false to end the oscillator
      if (settings.audio.synthesisRegime === 'local') {
        audio(motion)
      }
      if (settings.audio.synthesisRegime === 'remote') {
        audio(motion)
        if (socketIsInit) {
          socket.emit('motion message', motion)
        }
      }
    }
  }

  if (device.desktop()) {
    // Frontend for the desktop
    document.querySelectorAll('.mobile').forEach((element) => {
      element.style.display = 'none'
    })
    document.querySelector('.info').style.display = 'block'

    // Generating a QR-code for a popup
    fetch(`/hostname`)
      .then((response) => {
        if (response.status !== 200) {
          document.querySelector('.errors').innerHTML += `Error while loading data from server.<br>Status: ${response.status}`
          return
        }

        // If all is well, we parse the response
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

    // Hang the handler on the button of QR-code popup
    document.querySelector('.title__qr').addEventListener('click', () => {
      qrElement.classList.toggle('qr--show')
    })

    // Enabling the socket to listen to external motion events
    socketInit()

    socket.connect()

    // Hanging listeners of websocket events
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

      clientsCount = clientsSize

      // If we are the only ones left
      if (clientsSize === 1) {
        connectionsStatus.textContent = language.connection.waiting
        connectionsStatus.classList.remove('connections--ready')
        connectionsStatus.classList.add('connections--wait')
        motionElement.classList.add('inactive')
        qrElement.classList.add('qr--show')
      }
      if (clientsSize > 1) {
        // Minus our device
        connectionsStatus.textContent = `${language.connection.connected} (${clientsSize - 1})`
        connectionsStatus.classList.remove('connections--wait')
        connectionsStatus.classList.add('connections--ready')
        motionElement.classList.remove('inactive')
        qrElement.classList.remove('qr--show')

        // When connecting a smartphone to the desktop, the desktop settings overwrite the smartphone settings
        settings.audio.synthesisRegime = 'remote'
        socket.emit('settings message', settings)
      }
    })

    latency('desktop')

    // On motion object update
    socket.on('motion message', (motion) => {

      // Update the DOM only when the value changes
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
    // To update the settings object
    socket.on('settings message', (settingsData) => {
      Object.assign(settings, settingsData) // Updating an object
      syncSettingsFrontend(settingsData) // Updating input fields
    })

    receiverRegimeIsInit = true

  } else if (device.mobile()) {
    // Checking the accelerometer on the device
    // iOS 13
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((response) => {
          if (response == 'granted') {
            // If allowed, hang the corresponding handler
            window.addEventListener('devicemotion', onMotion)
          }
        })
        .catch(console.error)
    }
    // iOS 12 and Android
    else if ('ondevicemotion' in window) {
      window.addEventListener('devicemotion', onMotion)
    }
    // No accelerometer
    else {
      document.querySelector('#motionSupported').innerHTML = 'Error: accelerometer is not supported.<br>Ошибка: акселерометр не поддерживается.<br>'
    }
  }

  settingsInit()
}
