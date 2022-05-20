// Функция генерирует звукоряд

// Принимает:
// root - базовая частота, самая низкая частота
// octaveAmount - количество октав
// tonesInOctaveAmount - количество тонов (нот) в октаве

// Отдаёт:
// const tonesArray[] - массив тонов (звукоряд)

import { div, getNearbyValues, toFixedNumber } from './helpers'

export const notes = []

export function notesInit(root = 8.1757, octaveAmount = 12, tonesInOctaveAmount = 12) {
  let tonesAmount = octaveAmount * tonesInOctaveAmount // Количество тонов

  for (let i = 0; i < tonesAmount; i++) {
    notes[i] = toFixedNumber(root * 2 ** (i / tonesInOctaveAmount)) // Формируем равномерно темперированный звукоряд
  }
}

// Функция преобразует индекс массива notes[] в название ноты

const notesNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function getNoteName(frequency) {
  // Находим индекс в массиве нот
  const notesIndex = notes.indexOf(frequency)

  // Если такого значения в массиве нет, значит мы звучим за диапазоном нот
  if (notesIndex < 0) {
    return `За диапазоном нот`
  }

  // Номер октавы
  const octave = div(notesIndex, 12) - 1

  // Порядковый номер ноты в рамках октавы
  // Например, D == 3 (C - C# - D)
  const noteNumberOnOctave = notesIndex + 1 - 12 * (octave + 1)

  // Собираем название ноты вместе с номером октавы
  const noteName = notesNames[noteNumberOnOctave - 1] + String(octave)

  return noteName
}

// Функция приводит звучащий звук к ближайшей ноте
// pitchCorrection
export function pitchDetection(frequency) {
  const nearbyValues = getNearbyValues(frequency, notes)
  console.log(nearbyValues[0], nearbyValues[1])
  console.log(getNoteName(nearbyValues[0]), getNoteName(nearbyValues[1]))
}
