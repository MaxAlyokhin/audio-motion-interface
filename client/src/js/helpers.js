// Функция округляет значение до 4 знаков после запятой по-умолчанию
// Принимает число и количество знаков после запятой
// Отдаёт округлённое число
export function toFixedNumber(number, digits = 4) {
  let pow = Math.pow(10, digits)
  return Math.round(number * pow) / pow
}

// Функция выполняет целочисленное деление
// Принимает два числа, что на что делить
// Отдаёт искомое число
export function div(value, by) {
  return (value - (value % by)) / by
}

// Функция ищет ближайшее меньшее и большее число к заданному
// Принимает:
// - число, вокруг которого нужно найти ближайшие значения
// - массив чисел, из которых выбираем ближайшие значения
// Отдаёт массив из двух чисел: меньшее и большее
export function getNearbyValues(number, array) {
  const nearbyLess = Math.max(...array.filter((value) => value < number))
  const nearbyOver = Math.min(...array.filter((value) => value > number))

  return [nearbyLess, nearbyOver]
}
