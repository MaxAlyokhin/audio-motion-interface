import { settings } from './settings'

let audioContext = undefined

// Проверяем поддержку контекста браузером
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
} catch (error) {
  window.alert(`Браузер не поддерживается / Browser is not support`)
}

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

  // TODO: все осцилляторы должны подключаться к одному внешнему gainNode
  oscillator.connect(biquadFilter)
  biquadFilter.connect(gainNode)
  gainNode.connect(audioContext.destination)

  biquadFilter.type = 'lowpass'
  biquadFilter.gain.value = 1

  // Настраиваем по настройкам и акселерометру
  oscillator.type = settings.audio.oscillatorType
  oscillator.frequency.value = motionParameter * settings.audio.frequencyFactor
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

// Объявляем сущности как var, чтобы они были видны в пределах всей функции
let currentTime = audioContext.currentTime // по идее это не нужно здесь
let oscillator = audioContext.createOscillator()
let biquadFilter = audioContext.createBiquadFilter()
let gainNode = audioContext.createGain()

oscillator.connect(biquadFilter)
biquadFilter.connect(gainNode)
gainNode.connect(audioContext.destination)

biquadFilter.type = 'lowpass'
biquadFilter.gain.value = 1

function single(motion) {
  // Включаем осциллятор, когда движение превысило отсечку
  if (motion.isMotion) {
    // Собираем связку, делаем это только один раз в начале движения
    if (!oscillatorIsInit) {
      oscillator.start()
      oscillatorIsInit = true
    }

    // Динамически настраиваем связку
    // Эти данные обновляются по каждому событию движения
    oscillator.type = settings.audio.oscillatorType
    // TODO: выбрать: частота меняется плавно или сразу
    oscillator.frequency.value = motion.maximum * settings.audio.frequencyFactor
    oscillator.frequency.exponentialRampToValueAtTime(previousFrequency, currentTime + settings.audio.toneDuration)

    previousFrequency = oscillator.frequency.value

    biquadFilter.frequency.value = settings.audio.biquadFilterFrequency
    // gainNode.gain.value = settings.audio.gain
    // gainNode.gain.exponentialRampToValueAtTime(settings.audio.attenuation, +new Date() + settings.audio.toneDuration) // Затухание сигнала
  }
  // Гасим осциллятор и удаляем всю связку устройств, когда движение опустилось ниже отсечки
  else {
    // Делаем это только если осциллятор есть и работает
    // if (oscillatorIsInit) {
    //   oscillator.stop()
    //   oscillatorIsInit = false
    // }
  }
}

export function audio(motion) {
  if (settings.audio.oscillatorRegime === 'plural') {
    plural(motion)
  }

  if (settings.audio.oscillatorRegime === 'single') {
    single(motion)
  }
}

// TODO: можно гироскоп привязать к бикубическому фильтру
