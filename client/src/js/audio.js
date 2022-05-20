import { getNearbyValues, toFixedNumber } from './helpers'
import { getNoteName, notes, notesInit, pitchDetection } from './notes'
import { settings } from './settings'

let audioContext = undefined

// Проверяем поддержку контекста браузером
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
} catch (error) {
  window.alert(`Браузер не поддерживается / Browser is not support`)
}

// Определяем массив нот в рамках равномерной темперации
notesInit()

// Генерируемая частота звука и html-элемент, куда будем её записывать
let frequency = null
let frequencyElement = undefined

window.addEventListener('DOMContentLoaded', () => {
  frequencyElement = document.querySelector('.motion__frequency')
})

// Схема: осциллятор => фильтр => громкость

// Режим множественных осцилляторов (каждому событию движения соответствует свой осциллятор)

let previousFrequency = 0.01

// Функция генерирует звук
// Принимает показание датчика по одной оси
function runOscillator(motionParameter) {
  // Создаём связку
  let currentTime = audioContext.currentTime
  let oscillator = audioContext.createOscillator()
  let biquadFilter = audioContext.createBiquadFilter()
  let gainNode = audioContext.createGain()

  oscillator.connect(biquadFilter)
  biquadFilter.connect(gainNode)
  gainNode.connect(audioContext.destination)

  biquadFilter.type = 'lowpass'
  biquadFilter.gain.value = 1

  // Настраиваем по настройкам и акселерометру

  frequency = toFixedNumber(motionParameter * settings.audio.frequencyFactor, 1)
  frequencyElement.innerText = frequency

  oscillator.type = settings.audio.oscillatorType
  oscillator.frequency.value = frequency
  // oscillator.frequency.exponentialRampToValueAtTime(previousFrequency, currentTime + settings.audio.toneDuration)
  previousFrequency = oscillator.frequency.value

  biquadFilter.frequency.value = settings.audio.biquadFilterFrequency
  gainNode.gain.value = settings.audio.gain
  gainNode.gain.exponentialRampToValueAtTime(settings.audio.attenuation, currentTime + settings.audio.toneDuration) // Затухание сигнала

  // Генерим звук отрезком от currentTime до settings.audio.toneDuration
  oscillator.start(currentTime)
  oscillator.stop(currentTime + settings.audio.toneDuration)
}

function plural(motion) {
  if (motion.isMotion) {
    if (settings.audio.dataRegime === 'maximum') {
      runOscillator(motion.maximum)
    }

    if (settings.audio.dataRegime === 'different') {
      if (settings.audio.axis.alpha) {
        runOscillator(motion.alpha)
      }
      if (settings.audio.axis.beta) {
        runOscillator(motion.beta)
      }
      if (settings.audio.axis.gamma) {
        runOscillator(motion.gamma)
      }
    }
  }
}

// Режим единственного осциллятора

let oscillatorIsInit = false

let currentTime = undefined
let oscillator = undefined
let biquadFilter = undefined
let gainNode = undefined

function single(motion) {
  // Включаем осциллятор, когда движение превысило отсечку
  if (motion.isMotion) {
    // Собираем связку, делаем это только один раз в начале движения
    if (!oscillatorIsInit) {
      currentTime = audioContext.currentTime
      oscillator = audioContext.createOscillator()
      biquadFilter = audioContext.createBiquadFilter()
      gainNode = audioContext.createGain()

      oscillator.connect(biquadFilter)
      biquadFilter.connect(gainNode)
      gainNode.connect(audioContext.destination)

      biquadFilter.type = 'lowpass'
      biquadFilter.gain.value = 1

      oscillator.start()
      oscillatorIsInit = true
    }

    // Динамически настраиваем связку
    // Эти данные обновляются по каждому событию движения
    frequency = toFixedNumber(motion.maximum * settings.audio.frequencyFactor, 1)
    frequencyElement.innerText = frequency

    oscillator.type = settings.audio.oscillatorType
    oscillator.frequency.value = frequency
    oscillator.frequency.exponentialRampToValueAtTime(previousFrequency, currentTime + settings.audio.toneDuration)

    previousFrequency = oscillator.frequency.value

    biquadFilter.frequency.value = settings.audio.biquadFilterFrequency
    // gainNode.gain.value = settings.audio.gain
    // gainNode.gain.exponentialRampToValueAtTime(settings.audio.attenuation, +new Date() + settings.audio.toneDuration) // Затухание сигнала
  }
  // Гасим осциллятор и удаляем всю связку устройств, когда движение опустилось ниже отсечки
  else {
    // Делаем это только если осциллятор есть и работает
    if (oscillatorIsInit) {
      oscillator.stop()
      oscillatorIsInit = false
    }
  }
}

function spatial(motion) {
  if (motion.isMotion) {
    // Собираем связку, делаем это только один раз в начале движения
    if (!oscillatorIsInit) {
      currentTime = audioContext.currentTime
      oscillator = audioContext.createOscillator()
      biquadFilter = audioContext.createBiquadFilter()
      gainNode = audioContext.createGain()

      oscillator.connect(biquadFilter)
      biquadFilter.connect(gainNode)
      gainNode.connect(audioContext.destination)

      biquadFilter.type = 'lowpass'
      biquadFilter.gain.value = 1

      oscillator.start()
      oscillatorIsInit = true
    }

    // Динамически настраиваем связку
    // Эти данные обновляются по каждому событию движения
    frequency = toFixedNumber(motion.orientation * settings.audio.frequencyFactor, 1)
    frequencyElement.innerText = frequency

    pitchDetection(frequency)

    oscillator.type = settings.audio.oscillatorType
    oscillator.frequency.value = frequency
    // oscillator.frequency.exponentialRampToValueAtTime(previousFrequency, currentTime + settings.audio.toneDuration)

    // previousFrequency = oscillator.frequency.value

    biquadFilter.frequency.value = settings.audio.biquadFilterFrequency
    // gainNode.gain.value = settings.audio.gain
    // gainNode.gain.exponentialRampToValueAtTime(settings.audio.attenuation, +new Date() + settings.audio.toneDuration) // Затухание сигнала
  } else {
    if (oscillatorIsInit) {
      oscillator.stop()
      oscillatorIsInit = false
    }
  }
}

export function audio(motion) {
  if (settings.audio.oscillatorRegime === 'plural') {
    plural(motion)
  }

  if (settings.audio.oscillatorRegime === 'single') {
    single(motion)
  }

  if (settings.audio.oscillatorRegime === 'spatial') {
    spatial(motion)
  }
}
