import { audioContext } from './audio'
import { toFixedNumber } from './helpers'
import { socket, socketIsInit } from './websocket'

/**
 * Вычисляет задержку звука
 * На смартфоне она равна audioContext.outputLatency
 * На десктопе она равна audioContext.outputLatency + время передачи данных от смартфона
 * @param {String} device - тип устройства (смартфон или десктоп)
 * @return {Number} latency - задержка
 */

const latencyElement = document.querySelector('.latency__amount')
const updateFrequency = 5000

let intervalIsInit = false

export function latency(device) {
  if (device === 'desktop') {

    // Периодически отправляем ping с временем десктопа
    setInterval(() => {
      socket.emit('ping', Date.now())
    }, updateFrequency)

    // Со смартфона возвращается pong с тем же временем десктопа
    socket.on('pong', (dateOfPing) => {
      latencyElement.textContent = (Date.now() - dateOfPing) / 2 + toFixedNumber(audioContext.outputLatency, 3) * 1000
    })
  }

  if (device === 'mobile') {
    if (socketIsInit) {
      // Пришёл пинг с декстопа с таймстемпом
      // Возвращаем его обратно десктопу
      socket.on('ping', (dateFromDesktop) => {
        socket.emit('pong', dateFromDesktop)
      })
    }

    if (!intervalIsInit) {
      intervalIsInit = true
      // Пишем задержку в DOM
      setInterval(() => {
        latencyElement.textContent = toFixedNumber(audioContext.outputLatency, 3) * 1000
      }, updateFrequency)
    }
  }
}
