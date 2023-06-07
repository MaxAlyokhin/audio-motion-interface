import { notes } from './notes'
import { settings } from './settings'

/**
 * The function rounds the value to 4 decimal places by default
 * @param {Number} number - number
 * @param {Number} digits - number of decimal places
 * @return {Number} Returns a rounded number
 */

let pow = null
export function toFixedNumber(number, digits = 4) {
  pow = Math.pow(10, digits)
  return Math.round(number * pow) / pow
}

/**
 * The function performs integer division
 * @param {Number} value - what to divide
 * @param {Number} by - by what
 * @return {Number} Returns the number you are looking for
 */

export const div = (value, by) => (value - (value % by)) / by

/**
 * The function searches for the nearest lower and nearest higher number to a given number
 * @param {Number} number - the number around which we need to find the nearest values
 * @param {Array} array - an array of numbers from which we select the nearest values
 * @return {Array} Returns an array of two numbers: a smaller and a larger one
 */

let nearbyLess = null
let nearbyOver = null
export function getNearbyValues(number, array) {
  nearbyLess = Math.max(...array.filter((value) => value < number))
  isFinite(nearbyLess) ? nearbyLess : (nearbyLess = 0)
  nearbyOver = Math.min(...array.filter((value) => value > number))

  return [nearbyLess, nearbyOver]
}

/**
 * The function returns a string with the time of the call in the format number-month-year-hour-minutes-seconds
 * @return {String}
 */

export function getDate() {
  let date = new Date()
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
}

/**
 * Convert motion to frequency
 * @param {Object} motion - motion object from motion.js
 * @return {Number} Returns the frequency
 */

let frequency = null
export function orientationToFrequency(orientation) {
  // Define the frequency and the note
  // Do it even below the cutoff, so we can hit the right note before sound synthesis begins
  if (settings.audio.frequencyRegime === 'continuous') {
    // Exponential — degrees of position in degree log range (value difference) on the basis of 180 (maximum gyroscope value) + minimum value
    frequency = toFixedNumber(Math.pow(orientation, Math.log(settings.audio.frequenciesRange.to - settings.audio.frequenciesRange.from) / Math.log(180)) + settings.audio.frequenciesRange.from, 4)
  }

  if (settings.audio.frequencyRegime === 'tempered') {
    // Starting from 'from' in the chord upwards (to — from) notes by 180 degrees
    frequency = notes[settings.audio.notesRange.from + Math.floor(orientation * ((settings.audio.notesRange.to - settings.audio.notesRange.from) / 180))]
  }

  return frequency
}
