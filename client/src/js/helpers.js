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