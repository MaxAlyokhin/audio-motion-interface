// Функция округляет значение до 4 знаков после запятой по-умолчанию
// Принимает число и количество знаков после запятой
// Отдаёт округлённое число
let pow = null
export function toFixedNumber(number, digits = 4) {
  pow = Math.pow(10, digits)
  return Math.round(number * pow) / pow
}

// Функция выполняет целочисленное деление
// Принимает два числа, что на что делить
// Отдаёт искомое число
export const div = (value, by) => (value - (value % by)) / by

// Функция ищет ближайшее меньшее и большее число к заданному
// Принимает:
// - число, вокруг которого нужно найти ближайшие значения
// - массив чисел, из которых выбираем ближайшие значения
// Отдаёт массив из двух чисел: меньшее и большее
let nearbyLess = null
let nearbyOver = null
export function getNearbyValues(number, array) {
  nearbyLess = Math.max(...array.filter((value) => value < number))
  isFinite(nearbyLess) ? nearbyLess : (nearbyLess = 0)
  nearbyOver = Math.min(...array.filter((value) => value > number))

  return [nearbyLess, nearbyOver]
}
