import { div, getNearbyValues, toFixedNumber } from './helpers'
import { settings } from './settings'

export const notes = [] // Вычисленный звукоряд
let tunerActualElement = document.querySelector('.tuner__actual')
let percent = null
let nearbyValues = null
let maxNote = null
let actualNote = null
let previousNote = null

/**
 * Генерирует звукоряд
 * @param {Number} root - базовая частота, самая низкая частота
 * @param {Number} octaveAmount - количество октав
 * @param {Number} tonesInOctaveAmount - количество тонов (нот) в октаве
 * @return {Array} tonesArray - массив тонов (звукоряд)
 */

export function notesInit(root = 8.1757, octaveAmount = 11, tonesInOctaveAmount = 12) {
  let tonesAmount = octaveAmount * tonesInOctaveAmount // Количество тонов

  for (let i = 0; i < tonesAmount; i++) {
    notes[i] = toFixedNumber(root * 2 ** (i / tonesInOctaveAmount)) // Формируем равномерно темперированный звукоряд
  }
}

/**
 * Определяет имя ноты через частоту
 * @param {Number} frequency - частота
 * @return {String} noteName - имя ноты
 */

const notesNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export function getNoteName(frequency) {
  // Находим индекс в массиве нот
  const notesIndex = notes.indexOf(frequency)

  // Если такого значения в массиве нет, значит мы звучим за диапазоном нот
  if (notesIndex < 0) {
    return
  }

  // Номер октавы
  const octave = div(notesIndex, 12) - 1
  // Порядковый номер ноты в рамках октавы
  // Например, D === 3 (C - C# - D)
  const noteNumberOnOctave = notesIndex + 1 - 12 * (octave + 1)
  // Собираем название ноты вместе с номером октавы
  const noteName = notesNames[noteNumberOnOctave - 1] + String(octave)

  return noteName
}

// Функция приводит звучащий звук к ближайшей ноте
export function pitchDetection(frequency) {
  nearbyValues = getNearbyValues(frequency, notes)

  // В темперированном режиме сразу выводим имя ноты
  // В непрерывном находим вышестоящую ноту и считаем проценты от нашего положения
  // на отрезке между соседними нотами
  // Обновляем DOM только при изменении значения
  if (settings.audio.frequencyRegime === 'tempered') {
    actualNote = getNoteName(frequency)

    if (previousNote !== actualNote) {
      settings.ui.lite ? false : (tunerActualElement.textContent = actualNote)
    }
  } else {
    maxNote = getNoteName(nearbyValues[1])
    percent = toFixedNumber(((frequency - nearbyValues[0]) / (nearbyValues[1] - nearbyValues[0])) * 100, 1)

    if (previousNote !== `${maxNote} (${percent}%)`) {
      settings.ui.lite ? false : (tunerActualElement.textContent = `${maxNote} (${percent}%)`)
      previousNote = `${maxNote} (${percent}%)`
    }
  }
}
