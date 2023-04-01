import languageInit from './language'
import { audioInit } from './audio'
import { motionInit } from './motion'
import { checkLocalStorage } from './localstorage'
import { settingsExchangeInit } from './settingsExchange'

checkLocalStorage()
languageInit()
settingsExchangeInit()

window.addEventListener('load', () => {
  // Showing content
  document.querySelector('body').style.transition = 'all 1000ms cubic-bezier(0.83, 0, 0.17, 1)'
  document.querySelector('body').style.opacity = 1

  // The Run button starts the system
  document.querySelector('.button.run').addEventListener(
    'click',
    function () {
      document.querySelector('body').style.overflow = 'auto'

      audioInit()
      motionInit()

    },
    { once: true } // Only works once
  )

  document.querySelector('.button.run').addEventListener(
    'click',
    function () {
      document.querySelector('.cover').style.opacity = 0
      setTimeout(() => {
        document.querySelector('.cover').style.display = 'none'
      }, 1000)
    }
  )

  document.querySelector('.container .title span').addEventListener('click', () => {
    document.querySelector('.cover').style.display = 'flex'
    setTimeout(() => { document.querySelector('.cover').style.opacity = 1 })
  })

  // Displaying errors on the screen
  let errorElement = document.querySelector('.errors')
  window.addEventListener('error', (event) => {
    errorElement.innerHTML += `
      <div class="errors__message">${event.error.message}</div>
      <div>${event.error.stack}</div>
    `
  })
})
