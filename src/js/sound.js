import { settings } from './settings'

let audioContext = undefined

// Проверяем поддержку контекста браузером
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
} catch (error) {
  window.alert(`Браузер не поддерживается / Browser is not support`)
}

export function sound(absoluteMotion) {
  let currentTime = audioContext.currentTime // Получаем время начала тона
  let oscillator = audioContext.createOscillator() // Создаём генератор
  let biquadFilter = audioContext.createBiquadFilter() // Создаём фильтр
  let gainNode = audioContext.createGain() // Создаём ручку громкости

  // Схема: осциллятор => фильтр => громкость

  // Настраиваем генератор
  oscillator.type = settings.sound.oscillatorType // Тип волны - синусоида
  oscillator.frequency.value = absoluteMotion * settings.sound.frequencyFactor // Задаём частоту
  oscillator.connect(biquadFilter) // Подключаем к фильтру
  // oscillator.connect(gainNode)

  biquadFilter.type = 'lowpass' // Режем паразитные высокие частоты
  biquadFilter.frequency.setValueAtTime(
    settings.sound.biquadFilterFrequency,
    currentTime
  ) // Порог - 600 Гц
  biquadFilter.gain.setValueAtTime(1, currentTime) // Фильтр на полную
  biquadFilter.connect(gainNode) // Подключаем к ручке громкости

  // Настраиваем ручку громкости
  gainNode.gain.setValueAtTime(settings.sound.gain, currentTime) // Громкость одного тона должна быть кратна количеству одновременно звучащих тонов
  gainNode.gain.exponentialRampToValueAtTime(
    settings.sound.attenuation,
    currentTime + settings.sound.toneDuration
  ) // Затухание сигнала
  gainNode.connect(audioContext.destination) // Подключаем к источнику звука

  oscillator.start(currentTime) // Начинаем
  oscillator.stop(currentTime + settings.sound.toneDuration) // Заканчиваем тон через toneDuration
}
