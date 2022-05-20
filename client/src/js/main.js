import { motionInit } from './motion'

window.addEventListener('DOMContentLoaded', () => {
  // Показываем контент
  document.querySelector('body').style.opacity = 1

  // Кнопка Run запускает алгоритм
  document.querySelector('.button.run').addEventListener(
    'click',
    function () {
      motionInit()
      this.classList.add('run--is-running')
    },
    // Сработает только один раз
    { once: true }
  )

  // Вывод ошибок на экран
  let errorElement = document.querySelector('.errors')
  window.addEventListener('error', (event) => {
    errorElement.innerHTML += `
      <div class="errors__message">${event.error.message}</div>
      <div>${event.error.stack}</div>
    `
  })
})
