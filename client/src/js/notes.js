import { div, getNearbyValues, toFixedNumber } from './helpers'
import { settings } from './settings'

export const notes = [] // Calculated scale
let tunerActualElement = document.querySelector('.tuner__actual')
let percent = null
let nearbyValues = null
let maxNote = null
let actualNote = null
let previousNote = null

/**
 * Generates a scale
 * @param {Number} root - base frequency, lowest frequency
 * @param {Number} octaveAmount - octave number
 * @param {Number} tonesInOctaveAmount - number of tones (notes) in an octave
 * @return {Array} tonesArray - tones array (scale)
 */

export function notesInit(root = 8.1757, octaveAmount = 11, tonesInOctaveAmount = 12) {
  let tonesAmount = octaveAmount * tonesInOctaveAmount // Number of tones

  for (let i = 0; i < tonesAmount; i++) {
    notes[i] = toFixedNumber(root * 2 ** (i / tonesInOctaveAmount)) // Forming an equal tempered scale
  }
}

/**
 * Defines the name of the note through the frequency
 * @param {Number} frequency - frequency
 * @return {String} noteName - note name
 */

const notesNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export function getNoteName(frequency) {
  // Find the index in the array of notes
  const notesIndex = notes.indexOf(frequency)

  // If there is no such value in the array, then we are sounding beyond the range of notes
  if (notesIndex < 0) {
    return
  }

  // Octave No.
  const octave = div(notesIndex, 12) - 1
  // The order number of the note within an octave
  // For example, D === 3 (C - C# - D)
  const noteNumberOnOctave = notesIndex + 1 - 12 * (octave + 1)
  // Assemble the name of the note together with the octave No.
  const noteName = notesNames[noteNumberOnOctave - 1] + String(octave)

  return noteName
}

/**
 * In continuous mode, returns the translation of the frequency into the [nearest top note, how much percent hit the note] array
 * @param {Number} frequency - frequency
 * @return {Array} [maxNote, percent]
 */

// The function brings the sound to the nearest note
export function pitchDetection(frequency) {
  nearbyValues = getNearbyValues(frequency, notes)

  // In tempered mode, immediately display the name of the note
  // In the continuous mode we find the higher note and count the percentage of our position
  // on the segment between neighboring notes
  // Update the DOM only when the value changes
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
    if (notes.indexOf(nearbyValues[0]) < 0) {
      return [0, percent]
    } else {
      return [notes.indexOf(nearbyValues[0]), percent]
    }

  }
}
