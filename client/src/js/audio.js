import { toFixedNumber } from './helpers'
import { notes, notesInit, pitchDetection } from './notes'
import { settings } from './settings'

let audioContext = null

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
let frequencyElement = null

window.addEventListener('DOMContentLoaded', () => {
  frequencyElement = document.querySelector('.motion__frequency')
})

// Связка это осциллятор => фильтр => громкость

// По сути в обоих режимах каждому жесту соответствует свой осциллятор,
// просто в сингле нет затухания и атаки, позволяющих накладывать звуки друг на друга
// Стоит сделать единый режим,

// Здесь включается осциллятор и далее уже не выключается за всё время сессии
// TODO: возможно это причина BAG-1

// Каждому жесту соответствует свой осциллятор
// У нас есть массив осцилляторов (вернее массивы элементов-узлов графа)
// При превышении отсечки мы можем сказать, что движение началось
// При скорости ниже отсечки мы можем сказать, что движение закончилось,
// отследив что это последнее событие движения в череде событий с помощью маркера motionIsOff.

let oscillatorArray = [] // Массив осцилляторов
let biquadFilterArray = [] // Массив фильтров
let gainNodeArray = [] // Массив ручек громкости
let motionIsOff = true // Маркер последнего события движения

let now = null // Переменная для фиксации времени начала движения

function plural(motion) {
  // Определяем частоту
  if (settings.audio.frequencyRegime === 'continuous') {
    let minFrequency = settings.audio.frequenciesRange.from
    let maxFrequency = settings.audio.frequenciesRange.to

    // 1 линейный вариант
    // Градусы положения умножить на диапазон (разница значений) делённый на 180 (максимальное значение гироскопа) + минимальное значение
    // frequency = toFixedNumber(motion.orientation * ((maxFrequency - minFrequency) / 180) + minFrequency, 4)

    // 2 экспоненциальный вариант
    // Градусы положения в степени log диапазона (разницы значений) по основанию 180 (максимальное значение гироскопа) + минимальное значение
    frequency = toFixedNumber(Math.pow(motion.orientation, Math.log(maxFrequency - minFrequency) / Math.log(180)) + minFrequency, 4)
  }
  if (settings.audio.frequencyRegime === 'tempered') {
    let minNote = settings.audio.notesRange.from
    let maxNote = settings.audio.notesRange.to

    // Начиная с minNote в звукоряде наверх (maxNote - minNote) нот по 180 градусам распределяем
    frequency = notes[minNote + Math.floor(motion.orientation * ((maxNote - minNote) / 180))]
  }
  frequencyElement.innerText = frequency
  pitchDetection(frequency)

  // При превышении отсечки создаём связку
  if (motion.isMotion) {
    // Собираем связку, делаем это только один раз в начале движения
    if (motionIsOff) {
      // Фиксируем время начала движения
      now = audioContext.currentTime
      oscillatorArray.push(audioContext.createOscillator())
      biquadFilterArray.push(audioContext.createBiquadFilter())
      gainNodeArray.push(audioContext.createGain())

      oscillatorArray[oscillatorArray.length - 1].connect(biquadFilterArray[biquadFilterArray.length - 1])
      biquadFilterArray[biquadFilterArray.length - 1].connect(gainNodeArray[gainNodeArray.length - 1])
      gainNodeArray[gainNodeArray.length - 1].connect(audioContext.destination)

      biquadFilterArray[biquadFilterArray.length - 1].type = 'lowpass'
      biquadFilterArray[biquadFilterArray.length - 1].gain.value = 1
      gainNodeArray[gainNodeArray.length - 1].gain.setValueAtTime(settings.audio.attenuation, now, 0.005)

      oscillatorArray[oscillatorArray.length - 1].start()
      motionIsOff = false
    }

    // Здесь во время движения мы управляем поведением последней собранной связки (length - 1 это последний элемент массивов)
    // Динамически настраиваем связку
    // Эти данные обновляются по каждому событию движения
    oscillatorArray[oscillatorArray.length - 1].type = settings.audio.oscillatorType
    oscillatorArray[oscillatorArray.length - 1].frequency.value = frequency
    biquadFilterArray[biquadFilterArray.length - 1].frequency.value = settings.audio.biquadFilterFrequency

    // Управление громкостью
    if (settings.audio.attack) {
      gainNodeArray[gainNodeArray.length - 1].gain.linearRampToValueAtTime(settings.audio.gain, now + settings.audio.attack)
    } else if (settings.motion.gainGeneration === true) {
      gainNodeArray[gainNodeArray.length - 1].gain.setTargetAtTime(motion.maximum * settings.audio.gain, audioContext.currentTime, 0.005)
    } else {
      gainNodeArray[gainNodeArray.length - 1].gain.setTargetAtTime(settings.audio.gain, audioContext.currentTime, 0.005)
    }

    console.log(oscillatorArray.length)
  }
  // Если оказались ниже отсечки, а до этого были выше (motionIsOff === false),
  // значит мы поймали последнее событие движения (движение остановлено).
  // Тогда планируем затухание сигнала и удаление связки
  else if (motionIsOff === false) {
    // Планируем затухание громкости и остановку осциллятора
    // последних элементов в массивах на момент остановки движения
    gainNodeArray[gainNodeArray.length - 1].gain.exponentialRampToValueAtTime(
      settings.audio.attenuation,
      audioContext.currentTime + settings.audio.toneDuration + settings.audio.attack
    )

    oscillatorArray[oscillatorArray.length - 1].stop(audioContext.currentTime + settings.audio.toneDuration + settings.audio.attack)

    // Планируем удаление этих элементов, они будут первыми с массивах
    // на момент вызова таймаута
    setTimeout(() => {
      oscillatorArray.shift()
      biquadFilterArray.shift()
      gainNodeArray.shift()
    }, settings.audio.toneDuration * 1000)

    motionIsOff = true

    console.log(oscillatorArray.length)
  }
}

export function audio(motion) {
  plural(motion)
}
