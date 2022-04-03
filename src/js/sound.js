let audioContext = undefined

// Проверяем поддержку контекста браузером
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
} catch (error) {
  window.alert(`Браузер не поддерживается / Browser is not support`)
}

let toneDuration = 0.2
let frequency = 55

export function sound(absoluteMotion) {
  let currentTime = audioContext.currentTime // Получаем время начала тона
  let oscillator = audioContext.createOscillator() // Создаём генератор
  let biquadFilter = audioContext.createBiquadFilter() // Создаём фильтр
  let gainNode = audioContext.createGain() // Создаём ручку громкости

  // Схема: осциллятор => фильтр => громкость

  // Настраиваем генератор
  oscillator.type = 'sine' // Тип волны - синусоида
  oscillator.frequency.value = absoluteMotion * 20 // Задаём частоту
  oscillator.connect(biquadFilter) // Подключаем к фильтру
  // oscillator.connect(gainNode)

  biquadFilter.type = 'lowpass' // Режем паразитные высокие частоты
  biquadFilter.frequency.setValueAtTime(600, currentTime) // Порог - 600 Гц
  biquadFilter.gain.setValueAtTime(1, currentTime) // Фильтр на полную
  biquadFilter.connect(gainNode) // Подключаем к ручке громкости

  // Настраиваем ручку громкости
  gainNode.gain.setValueAtTime(0.08, currentTime) // Громкость одного тона должна быть кратна количеству одновременно звучащих тонов
  gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + toneDuration) // Затухание сигнала
  gainNode.connect(audioContext.destination) // Подключаем к источнику звука

  oscillator.start(currentTime) // Начинаем
  oscillator.stop(currentTime + toneDuration) // Заканчиваем тон через toneDuration
}
