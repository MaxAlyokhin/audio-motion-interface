import { audioContext } from './audio'
import { toFixedNumber } from './helpers'
import { socket, socketIsInit } from './websocket'

/**
 * Calculates the sound latency
 * On the smartphone it is equal to audioContext.outputLatency
 * On the desktop it is equal to audioContext.outputLatency + the data transmission time from the smartphone
 * @param {String} device - device type (smartphone or desktop)
 * @return {Number} latency
 */

const latencyElement = document.querySelector('.latency__amount')
const updateFrequency = 5000

let intervalIsInit = false

export function latency(device) {
  if (device === 'desktop') {

    // Periodically send a ping with the desktop time
    setInterval(() => {
      socket.emit('ping', Date.now())
    }, updateFrequency)

    // From the smartphone returns pong with the same desktop time
    socket.on('pong', (dateOfPing) => {
      latencyElement.textContent = (Date.now() - dateOfPing) / 2 + toFixedNumber(audioContext.outputLatency, 3) * 1000
    })
  }

  if (device === 'mobile') {
    if (socketIsInit) {
      // A ping came from the desktop with timestamp
      // Bringing it back to the desktop
      socket.on('ping', (dateFromDesktop) => {
        socket.emit('pong', dateFromDesktop)
      })
    }

    if (!intervalIsInit) {
      intervalIsInit = true
      // Writing a latency in the DOM
      setInterval(() => {
        latencyElement.textContent = toFixedNumber(audioContext.outputLatency, 3) * 1000
      }, updateFrequency)
    }
  }
}
