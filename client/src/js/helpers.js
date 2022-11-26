/**
 * Функция округляет значение до 4 знаков после запятой по-умолчанию
 * @param {Number} number - число
 * @param {Number} digits - количество знаков после запятой
 * @return {Number} Отдаёт округлённое число
 */

let pow = null
export function toFixedNumber(number, digits = 4) {
  pow = Math.pow(10, digits)
  return Math.round(number * pow) / pow
}

/**
 * Функция выполняет целочисленное деление
 * @param {Number} value - что делить
 * @param {Number} by - на что делить
 * @return {Number} Отдаёт искомое число
 */

export const div = (value, by) => (value - (value % by)) / by

/**
 * Функция ищет ближайшее меньшее и большее число к заданному
 * @param {Number} number - число, вокруг которого нужно найти ближайшие значения
 * @param {Array} array - массив чисел, из которых выбираем ближайшие значения
 * @return {Array} Отдаёт массив из двух чисел: меньшее и большее
 */

let nearbyLess = null
let nearbyOver = null
export function getNearbyValues(number, array) {
  nearbyLess = Math.max(...array.filter((value) => value < number))
  isFinite(nearbyLess) ? nearbyLess : (nearbyLess = 0)
  nearbyOver = Math.min(...array.filter((value) => value > number))

  return [nearbyLess, nearbyOver]
}