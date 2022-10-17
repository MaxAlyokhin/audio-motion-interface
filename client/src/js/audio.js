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
let previousFrequency = null // Для более эффективной работы с обновлением DOM

let countElement = null // Количество осцилляторов

window.addEventListener('DOMContentLoaded', () => {
  frequencyElement = document.querySelector('.motion__frequency')
  countElement = document.querySelector('.motion__count')
})

// Граф - это осциллятор => фильтр => громкость
// Событие движения - js-событие, генерируемое каждые 16мс смартфоном, содержащее параметры движения
// События возникают даже в состоянии покоя - в этом случае параметры движения нулевые
// Отсечка - минимальная скорость движения, при которой заводится система
// Жест - набор событий движения от превышения отсечки до значения ниже отсечки
// Каждому жесту соответствует свой осциллятор

// У нас есть массив осцилляторов (вернее массивы элементов-узлов графа)
// При превышении отсечки мы можем сказать, что движение началось
// При скорости ниже отсечки мы можем сказать, что движение закончилось,
// отследив что это последнее событие движения в череде событий с помощью маркера motionIsOff.

// Здесь включается осциллятор и далее уже не выключается за всё время сессии
// TODO: возможно это причина BAG-1

let oscillatorArray = [] // Массив осцилляторов
let biquadFilterArray = [] // Массив фильтров
let gainNodeArray = [] // Массив ручек громкости
let motionIsOff = true // Маркер последнего события движения

let now = null // Переменная для фиксации времени начала движения

export function audio(motion) {
  // Определяем частоту
  if (settings.audio.frequencyRegime === 'continuous') {
    let minFrequency = settings.audio.frequenciesRange.from
    let maxFrequency = settings.audio.frequenciesRange.to

    // 1 линейный вариант
    // Градусы положения умножить на диапазон (разница значений) делённый на 180 (максимальное значение гироскопа) + минимальное значение
    // frequency = toFixedNumber(motion.orientation * ((maxFrequency - minFrequency) / 180) + minFrequency, 4)

// Функция вызывается ≈ каждые 16мс
export function audio(motion) {
  // Определяем частоту и ноту
  // Делаем это даже ниже отсечки, чтобы можно было попасть в нужную ноту
  // до начала синтеза звука
  if (settings.audio.frequencyRegime === 'continuous') {
    // Экспоненциально - градусы положения в степени log диапазона (разницы значений) по основанию 180 (максимальное значение гироскопа) + минимальное значение
    frequency = toFixedNumber(Math.pow(motion.orientation, Math.log(settings.audio.frequenciesRange.to - settings.audio.frequenciesRange.from) / Math.log(180)) + settings.audio.frequenciesRange.from, 4)
  }
  if (settings.audio.frequencyRegime === 'tempered') {
    // Начиная с from в звукоряде наверх (to - from) нот по 180 градусам распределяем
    frequency = notes[settings.audio.notesRange.from + Math.floor(motion.orientation * ((settings.audio.notesRange.to - settings.audio.notesRange.from) / 180))]
  }

  // Обновляем DOM только при изменении значения
  if (previousFrequency !== frequency) {
    settings.lite ? false : (frequencyElement.textContent = frequency)
    previousFrequency = frequency
  }

  // Переводим частоту в ноту
  pitchDetection(frequency)

  // Отсечка превышена - движение началось
  if (motion.isMotion) {
    // Собираем граф, делаем это только один раз в начале движения
    if (motionIsOff) {
      // Фиксируем время начала движения
      now = audioContext.currentTime

      oscillatorArray.push(audioContext.createOscillator())
      biquadFilterArray.push(audioContext.createBiquadFilter())
      gainNodeArray.push(audioContext.createGain())

      oscillatorArray[oscillatorArray.length - 1].connect(biquadFilterArray[biquadFilterArray.length - 1])
      biquadFilterArray[biquadFilterArray.length - 1].connect(gainNodeArray[gainNodeArray.length - 1])
      gainNodeArray[gainNodeArray.length - 1].connect(compressor)

      oscillatorArray[oscillatorArray.length - 1].type = settings.audio.oscillatorType

      biquadFilterArray[biquadFilterArray.length - 1].type = 'lowpass'
      biquadFilterArray[biquadFilterArray.length - 1].Q.value = settings.audio.biquadFilterQ
      biquadFilterArray[biquadFilterArray.length - 1].frequency.value = settings.audio.biquadFilterFrequency

      // Изначальная громкость минимальна
      gainNodeArray[gainNodeArray.length - 1].gain.setValueAtTime(0.0001, now, 0.005)

      oscillatorArray[oscillatorArray.length - 1].start()

      motionIsOff = false
    }

    // Здесь во время движения мы управляем поведением последнего собранного графа (length - 1 это последний элемент массивов)
    // Динамически настраиваем граф - он обновляется по каждому событию движения

    oscillatorArray[oscillatorArray.length - 1].frequency.value = frequency

    // Управление громкостью
    if (settings.audio.attack) {
      gainNodeArray[gainNodeArray.length - 1].gain.linearRampToValueAtTime(settings.audio.gain, now + settings.audio.attack)
    } else if (settings.motion.gainGeneration === true) {
      gainNodeArray[gainNodeArray.length - 1].gain.setTargetAtTime(motion.maximum * settings.audio.gain, audioContext.currentTime, 0.005)
    } else {
      gainNodeArray[gainNodeArray.length - 1].gain.setTargetAtTime(settings.audio.gain, audioContext.currentTime, 0.005)
    }

    settings.lite ? false : (countElement.textContent = oscillatorArray.length)
    if (oscillatorArray.length >= 120) countElement.classList.add('warning')
  }
  // Если оказались ниже отсечки, а до этого были выше (motionIsOff === false),
  // значит мы поймали последнее событие движения (движение остановлено).
  // Тогда планируем затухание сигнала и удаление графа
  else if (motionIsOff === false) {
    let end = audioContext.currentTime + settings.audio.release + settings.audio.attack

    // Планируем затухание громкости и остановку осциллятора
    // последних элементов в массивах на момент остановки движения
    gainNodeArray[gainNodeArray.length - 1].gain.exponentialRampToValueAtTime(settings.audio.attenuation, end)

    // Удаление возможных пиков
    gainNodeArray[gainNodeArray.length - 1].gain.setTargetAtTime(0.0001, end, 0.005)

    // + 0.1 это время полного погашения громкости на setTargetAtTime с запасом
    oscillatorArray[oscillatorArray.length - 1].stop(end + 0.1)

    // Планируем удаление этих элементов, они будут первыми с массивах
    // на момент вызова таймаута
    setTimeout(() => {
      oscillatorArray.shift()
      biquadFilterArray.shift()
      gainNodeArray.shift()

      settings.lite ? false : (countElement.textContent = oscillatorArray.length)
      if (oscillatorArray.length < 120) countElement.classList.remove('warning')
    }, (settings.audio.release + settings.audio.attack + 0.1) * 1000)

    motionIsOff = true
  }
}
