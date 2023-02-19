// Здесь инициализируется объект настроек
// Он изменяется через мутации
// Мутации запускаются по событиям интерфейса управления
// и синхронизируют настройки по вебсокету с удалённым десктопом

import { updateCompressorSettings } from './audio'
import { toFixedNumber } from './helpers'
import { language } from './language'
import { getNoteName, notes } from './notes'
import { socketInit, socketIsInit, socket } from './websocket'

// Элементы настроек
let releaseElement = null
let attenuationElement = null
let frequenciesRangeElement = null
let notesRangeElement = null
let synthesisRegimeElement = null
let frequencyRegimeElement = null
let thresholdElement = null
let thresholdTypeElement = null
let waveElement = null
let filterElement = null
let factorElement = null
let attackElement = null
let gainElement = null
let gainGenerationOptionElement = null
let gainGenerationElement = null
let shortcutsElement = null
let keyElements = null
let liteElement = null
let sphereElement = null
let interfaceRegimeElement = null
let containerElement = null
let interfaceRegimeOnElement = null
let interfaceRegimeOnButtonElement = null
let connectionsToServer = null
let compressorElement = null
let LFOElement = null
let timeoutElement = null
let themeElement = null
let bodyElement = null
let slideElements = null

window.addEventListener('DOMContentLoaded', () => {
  synthesisRegimeElement = document.querySelector('.synthesis-regime')
  frequencyRegimeElement = document.querySelector('.frequency-regime')
  thresholdElement = document.querySelector('.threshold')
  thresholdTypeElement = document.querySelector('.cutoff-type')
  waveElement = document.querySelector('.wave')
  filterElement = document.querySelector('.filter')
  factorElement = document.querySelector('.factor')
  attackElement = document.querySelector('.attack')
  gainElement = document.querySelector('.gain')
  releaseElement = document.querySelector('.release-container')
  attenuationElement = document.querySelector('.attenuation-container')
  frequenciesRangeElement = document.querySelector('.frequencies-range')
  notesRangeElement = document.querySelector('.notes-range')
  gainGenerationOptionElement = document.querySelector('.gain-generation')
  gainGenerationElement = document.querySelector('.gain-generation__container')
  shortcutsElement = document.querySelector('.shortcuts__container')
  keyElements = document.querySelectorAll('.key')
  liteElement = document.querySelector('.lite__container')
  sphereElement = document.querySelector('.sphere__container')
  interfaceRegimeElement = document.querySelector('.interface-regime')
  containerElement = document.querySelector('.container')
  interfaceRegimeOnElement = document.querySelector('.interface-regime-on')
  interfaceRegimeOnButtonElement = document.querySelector('.interface-regime-on__button')
  connectionsToServer = document.querySelector('.connections__to-server')
  compressorElement = document.querySelector('.compressor-element')
  LFOElement = document.querySelector('.lfo')
  timeoutElement = document.querySelector('.timeout')
  themeElement = document.querySelector('.theme__container')
  bodyElement = document.querySelector('body')
  slideElements = document.querySelectorAll('.slide')
})

// Настройки системы
export let settings = {
  ui: {
    shortcuts: false,
    lite: false,
    interfaceRegime: true,
    theme: 'dark'
  },
  motion: {
    threshold: 2.0,
    thresholdType: 'full',
    timeout: 150,
    gainGeneration: false,
    semiSphere: 'left',
  },
  audio: {
    attack: 0,
    release: 1.2,
    gain: 0.01,
    oscillatorType: 'sine',
    biquadFilterFrequency: 600.0,
    biquadFilterQ: 1,
    attenuation: 0.0001,
    synthesisRegime: 'local',
    frequencyRegime: 'continuous',
    frequenciesRange: {
      from: 0.0,
      to: 600.0,
    },
    notesRange: {
      from: 48,
      to: 60,
    },
    compressor: {
      threshold: 0,
      knee: 40,
      ratio: 12,
      attack: 0,
      release: 0,
    },
    LFO: {
      enabled: false,
      type: 'sine',
      rate: 1,
      depth: 1,
    },
  },
}

// Мутации
export const mutations = {
  setShortcuts: (value) => {
    value === 'true' ? (settings.ui.shortcuts = true) : (settings.ui.shortcuts = false)
  },

  setLite: (value) => {
    value === 'true' ? (settings.ui.lite = true) : (settings.ui.lite = false)
    syncSettings()
  },

  setTheme: (value) => {
    settings.ui.theme = value
    syncSettings()
  },

  setSemiSphere: (value) => {
    settings.motion.semiSphere = value
    syncSettings()
  },

  setInterfaceRegime: () => {
    settings.ui.interfaceRegime = !settings.ui.interfaceRegime

    if (settings.ui.interfaceRegime) {
      interfaceRegimeOnElement.style.opacity = 0
      setTimeout(() => {
        interfaceRegimeOnElement.style.display = 'none'
        containerElement.style.display = 'block'
        containerElement.style.opacity = 1
      }, 200)
    } else {
      containerElement.style.opacity = 0
      setTimeout(() => {
        containerElement.style.display = 'none'
        interfaceRegimeOnElement.style.display = 'flex'
        interfaceRegimeOnElement.style.opacity = 1
      }, 200)
    }
  },

  motion: {
    setThreshold: (threshold) => {
      isNaN(threshold) || threshold < 0 ? (settings.motion.threshold = 0) : (settings.motion.threshold = threshold)
      syncSettings()
    },

    setThresholdType: (thresholdType) => {
      settings.motion.thresholdType = thresholdType
      syncSettings()
    },

    setGainGeneration: (value) => {
      value === 'true' ? (settings.motion.gainGeneration = true) : (settings.motion.gainGeneration = false)
      syncSettings()
    },

    setMotionTimeout: (timeout) => {
      isNaN(timeout) || timeout < 0 ? (settings.motion.timeout = 0) : (settings.motion.timeout = timeout)
      syncSettings()
    }
  },

  audio: {
    setWaveType: (waveType) => {
      settings.audio.oscillatorType = String(waveType)
      syncSettings()
    },

    setRelease: (release) => {
      // 0.05 - минимальная длина тона, которую можно погасить без пиков
      isNaN(release) || release === 0 || release < 0 ? (settings.audio.release = 0.05) : (settings.audio.release = release)
      syncSettings()
    },

    setBiquadFilterFrequency: (biquadFilterFrequency) => {
      if (isNaN(biquadFilterFrequency) || biquadFilterFrequency < 0) {
        settings.audio.biquadFilterFrequency = 0
      } else if (biquadFilterFrequency > 24000) {
        settings.audio.biquadFilterFrequency = 24000
      } else {
        settings.audio.biquadFilterFrequency = biquadFilterFrequency
      }

      syncSettings()
    },

    setBiquadFilterQ: (biquadFilterQ) => {
      if (isNaN(biquadFilterQ) || biquadFilterQ === 0) {
        settings.audio.biquadFilterQ = 0.0001
      } else if (biquadFilterQ > 1000) {
        settings.audio.biquadFilterQ = 1000
      } else {
        settings.audio.biquadFilterQ = biquadFilterQ
      }

      syncSettings()
    },

    setAttenuation: (attenuation) => {
      isNaN(attenuation) || attenuation === 0 || attenuation < 0 ? (settings.audio.attenuation = 0.0001) : (settings.audio.attenuation = attenuation)
      syncSettings()
    },

    setAttack: (attack) => {
      isNaN(attack) || attack < 0 ? (settings.audio.attack = 0) : (settings.audio.attack = attack)
      syncSettings()
    },

    setGain: (gain) => {
      isNaN(gain) || gain < 0 ? (settings.audio.gain = 0) : (settings.audio.gain = gain)
      syncSettings()
    },

    setSynthesisRegime: (synthesisRegime) => {
      settings.audio.synthesisRegime = synthesisRegime

      if (settings.audio.synthesisRegime === 'local') {
        socket.disconnect()
        document.querySelector('.info').style.display = 'none'
      }
      if (settings.audio.synthesisRegime === 'remote') {
        socket.connect()
        document.querySelector('.info').style.display = 'block'
      }
    },

    setFrequencyRegime: (frequencyRegime) => {
      settings.audio.frequencyRegime = frequencyRegime

      if (frequencyRegime === 'continuous') {
        frequenciesRangeElement.style.display = 'flex'
        notesRangeElement.style.display = 'none'
      }
      if (frequencyRegime === 'tempered') {
        frequenciesRangeElement.style.display = 'none'
        notesRangeElement.style.display = 'flex'
      }

      syncSettings()
    },

    setFrequencyRange: (rangeType, frequency) => {
      if (rangeType === 'from') {
        if (isNaN(frequency) || frequency < 0) {
          settings.audio.frequenciesRange.from = 0
        } else if (frequency > 24000 || frequency >= settings.audio.frequenciesRange.to) {
          settings.audio.frequenciesRange.from = settings.audio.frequenciesRange.to - 1
        } else {
          settings.audio.frequenciesRange.from = frequency
        }
      }
      if (rangeType === 'to') {
        if (isNaN(frequency) || frequency < 0) {
          settings.audio.frequenciesRange.to = 0
        } else if (frequency > 24000) {
          settings.audio.frequenciesRange.to = 24000
        } else if (frequency <= settings.audio.frequenciesRange.from) {
          settings.audio.frequenciesRange.to = settings.audio.frequenciesRange.from + 1
        } else {
          settings.audio.frequenciesRange.to = frequency
        }
      }

      syncSettings()
    },

    setNoteRange: (rangeType, note) => {
      if (rangeType === 'from') {
        if (isNaN(note) || note < 0) {
          settings.audio.notesRange.from = 0
        } else if (note > 131 || note >= settings.audio.notesRange.to) {
          settings.audio.notesRange.from = settings.audio.notesRange.to - 1
        } else {
          settings.audio.notesRange.from = note
        }
      }
      if (rangeType === 'to') {
        if (isNaN(note) || note < 0) {
          settings.audio.notesRange.to = 0
        } else if (note >= 131) {
          settings.audio.notesRange.to = 131
        } else if (note <= settings.audio.notesRange.from) {
          settings.audio.notesRange.to = settings.audio.notesRange.from + 1
        } else {
          settings.audio.notesRange.to = note
        }
      }

      syncSettings()
    },

    setCompressorParameter: (parameter, value) => {
      switch (parameter) {
        case 'threshold':
          if (isNaN(value) || value < -100) {
            settings.audio.compressor[parameter] = -100
          } else if (value > 0) {
            settings.audio.compressor[parameter] = 0
          } else {
            settings.audio.compressor[parameter] = value
          }
          break

        case 'knee':
          if (isNaN(value) || value < 0) {
            settings.audio.compressor[parameter] = 0
          } else if (value > 40) {
            settings.audio.compressor[parameter] = 40
          } else {
            settings.audio.compressor[parameter] = value
          }
          break

        case 'ratio':
          if (isNaN(value) || value < 0) {
            settings.audio.compressor[parameter] = 1
          } else if (value > 20) {
            settings.audio.compressor[parameter] = 20
          } else {
            settings.audio.compressor[parameter] = value
          }
          break

        case 'attack':
          if (isNaN(value) || value < 0) {
            settings.audio.compressor[parameter] = 0
          } else if (value > 1) {
            settings.audio.compressor[parameter] = 1
          } else {
            settings.audio.compressor[parameter] = value
          }
          break

        case 'release':
          if (isNaN(value) || value < 0) {
            settings.audio.compressor[parameter] = 0
          } else if (value > 1) {
            settings.audio.compressor[parameter] = 1
          } else {
            settings.audio.compressor[parameter] = value
          }
          break
      }

      updateCompressorSettings(settings.audio.compressor)
      syncSettings()
    },

    setLFOParameter: (parameter, value) => {
      switch (parameter) {
        case 'rate':
          if (isNaN(value) || value < 0) {
            settings.audio.LFO.rate = 0
          } else if (value > 24000) {
            settings.audio.LFO.rate = 24000
          } else {
            settings.audio.LFO.rate = value
          }
          break

        case 'depth':
          if (isNaN(value) || value < 0) {
            settings.audio.LFO.depth = 0
          } else if (value > 1) {
            settings.audio.LFO.depth = 1
          } else {
            settings.audio.LFO.depth = value
          }

          break

        case 'enabled':
          settings.audio.LFO.enabled = value === 'true' ? (settings.audio.LFO.enabled = true) : (settings.audio.LFO.enabled = false)
          break

        case 'type':
          settings.audio.LFO.type = value
      }

      syncSettings()
    },
  },
}

// Функция обновляет input-поля в соответствии с пришедшим объектом настроек
export function syncSettingsFrontend(settings) {
  if (settings.audio.frequencyRegime === 'continuous') {
    document.querySelector('#continuous').checked = true
    frequenciesRangeElement.style.display = 'flex'
    notesRangeElement.style.display = 'none'
  }
  if (settings.audio.frequencyRegime === 'tempered') {
    document.querySelector('#tempered').checked = true
    frequenciesRangeElement.style.display = 'none'
    notesRangeElement.style.display = 'flex'
  }

  if (settings.motion.thresholdType === 'full') {
    thresholdTypeElement.querySelector('#cutoff-type-full').checked = true
  }
  if (settings.motion.thresholdType === 'up-to-peak') {
    thresholdTypeElement.querySelector('#cutoff-type-peak').checked = true
  }

  if (settings.motion.gainGeneration === true) {
    document.querySelector('#speedgain-yes').checked = true
  }
  if (settings.motion.gainGeneration === false) {
    document.querySelector('#speedgain-no').checked = true
  }

  if (settings.ui.lite === false) {
    liteElement.querySelector('#lite-no').checked = true
  }
  if (settings.ui.lite === true) {
    liteElement.querySelector('#lite-yes').checked = true
  }

  if (settings.ui.theme === 'dark') {
    themeElement.querySelector('#theme-dark').checked = true
    bodyElement.classList.add('dark')
  }
  if (settings.ui.theme === 'light') {
    themeElement.querySelector('#theme-light').checked = true
    bodyElement.classList.remove('dark')
  }

  if (settings.motion.semiSphere === 'left') {
    sphereElement.querySelector('#sphere-left').checked = true
  }
  if (settings.motion.semiSphere === 'right') {
    sphereElement.querySelector('#sphere-right').checked = true
  }

  frequenciesRangeElement.querySelector('.frequencies-range-from').value = settings.audio.frequenciesRange.from
  frequenciesRangeElement.querySelector('.frequencies-range-to').value = settings.audio.frequenciesRange.to
  notesRangeElement.querySelector('.notes-range-from').value = settings.audio.notesRange.from
  notesRangeElement.querySelector('.notes-range-to').value = settings.audio.notesRange.to
  notesRangeElement.querySelector('.notes-range__from-span').textContent = getNoteName(notes[settings.audio.notesRange.from])
  notesRangeElement.querySelector('.notes-range__to-span').textContent = getNoteName(notes[settings.audio.notesRange.to])
  thresholdElement.value = settings.motion.threshold
  thresholdTypeElement.value = settings.motion.thresholdType
  waveElement.value = settings.audio.oscillatorType
  filterElement.value = settings.audio.biquadFilterFrequency
  factorElement.value = settings.audio.biquadFilterQ
  attackElement.value = settings.audio.attack
  gainElement.value = settings.audio.gain
  releaseElement.querySelector('.release').value = settings.audio.release
  attenuationElement.querySelector('.attenuation').value = settings.audio.attenuation
  compressorElement.querySelector('.compressor-threshold').value = settings.audio.compressor.threshold
  compressorElement.querySelector('.compressor-knee').value = settings.audio.compressor.knee
  compressorElement.querySelector('.compressor-ratio').value = settings.audio.compressor.ratio
  compressorElement.querySelector('.compressor-attack').value = settings.audio.compressor.attack
  compressorElement.querySelector('.compressor-release').value = settings.audio.compressor.release
  LFOElement.querySelector('.lfo-wave').value = settings.audio.LFO.type
  LFOElement.querySelector('.rate').value = settings.audio.LFO.rate
  LFOElement.querySelector('.depth').value = settings.audio.LFO.depth
  timeoutElement.value = settings.motion.timeout
  if (settings.audio.LFO.enabled === true) {
    LFOElement.querySelector('#lfo-on').checked = true
  }
  if (settings.audio.LFO.enabled === false) {
    LFOElement.querySelector('#lfo-off').checked = true
  }
}

// Связываем объект настроек с интерфейсом управления
export function settingsInit() {
  // Включение веб-сокета на смартфоне
  synthesisRegimeElement.addEventListener('change', function (event) {
    if (!socketIsInit) {
      socketInit()

      socket.connect()

      // По обновлению объекта настроек
      socket.on('settings message', (settingsData) => {
        Object.assign(settings, settingsData) // Обновляем объект
        syncSettingsFrontend(settingsData) // Обновляем input-поля
      })

      // Вешаем слушатели вебсокет-событий
      socket.on('connect', () => {
        connectionsToServer.textContent = language.connection.ready
        connectionsToServer.classList.remove('connections--wait', 'connections--error')
        connectionsToServer.classList.add('connections--ready')
      })

      socket.on('disconnect', () => {
        connectionsToServer.textContent = language.connection.failed
        connectionsToServer.classList.remove('connections--wait', 'connections--ready')
        connectionsToServer.classList.add('connections--error')
      })
    }

    mutations.audio.setSynthesisRegime(event.target.value)
  })

  frequencyRegimeElement.addEventListener('change', function (event) {
    mutations.audio.setFrequencyRegime(event.target.value)
  })

  thresholdElement.addEventListener('input', function (event) {
    mutations.motion.setThreshold(parseFloat(event.value || this.value))
  })

  thresholdTypeElement.addEventListener('change', function (event) {
    mutations.motion.setThresholdType(event.target.value)
  })

  timeoutElement.addEventListener('input', function (event) {
    mutations.motion.setMotionTimeout(parseFloat(event.value || this.value))
  })

  gainGenerationElement.addEventListener('change', function (event) {
    mutations.motion.setGainGeneration(event.value || event.target.value)
  })

  frequenciesRangeElement.addEventListener('input', function (event) {
    if (event.target.classList[0] === 'frequencies-range-from') {
      mutations.audio.setFrequencyRange('from', parseFloat(event.value || event.target.value))
    }
    if (event.target.classList[0] === 'frequencies-range-to') {
      mutations.audio.setFrequencyRange('to', parseFloat(event.value || event.target.value))
    }
  })

  notesRangeElement.addEventListener('input', function (event) {
    if (event.target.classList[0] === 'notes-range-from') {
      mutations.audio.setNoteRange('from', parseFloat(event.value || event.target.value))
      notesRangeElement.querySelector('.notes-range__from-span').textContent = getNoteName(notes[settings.audio.notesRange.from])
    }
    if (event.target.classList[0] === 'notes-range-to') {
      mutations.audio.setNoteRange('to', parseFloat(event.value || event.target.value))
      notesRangeElement.querySelector('.notes-range__to-span').textContent = getNoteName(notes[settings.audio.notesRange.to])
    }
  })

  waveElement.addEventListener('change', function () {
    mutations.audio.setWaveType(this.options[this.selectedIndex].text)
  })

  releaseElement.addEventListener('input', function (event) {
    mutations.audio.setRelease(parseFloat(event.value || event.target.value))
  })

  filterElement.addEventListener('input', function (event) {
    mutations.audio.setBiquadFilterFrequency(parseFloat(event.value || this.value))
  })

  factorElement.addEventListener('input', function (event) {
    mutations.audio.setBiquadFilterQ(parseFloat(event.value || this.value))
  })

  attenuationElement.addEventListener('input', function (event) {
    mutations.audio.setAttenuation(parseFloat(event.value || event.target.value))
  })

  attackElement.addEventListener('input', function (event) {
    this.value != 0 ? gainGenerationOptionElement.classList.add('inactive') : gainGenerationOptionElement.classList.remove('inactive')
    mutations.audio.setAttack(parseFloat(event.value || this.value))
  })

  gainElement.addEventListener('input', function (event) {
    mutations.audio.setGain(parseFloat(event.value || this.value))
  })

  shortcutsElement.addEventListener('change', function (event) {
    mutations.setShortcuts(event.target.value)

    keyElements.forEach((element) => {
      settings.ui.shortcuts === true ? element.classList.add('key--show') : element.classList.remove('key--show')
    })
  })

  liteElement.addEventListener('change', function (event) {
    mutations.setLite(event.target.value)
  })

  themeElement.addEventListener('change', function (event) {
    mutations.setTheme(event.target.value)

    if (event.target.value === 'dark') bodyElement.classList.add('dark')
    if (event.target.value === 'light') bodyElement.classList.remove('dark')
  })

  sphereElement.addEventListener('change', function (event) {
    mutations.setSemiSphere(event.target.value)
  })

  // Выключение интерфейса управления
  interfaceRegimeElement.addEventListener('click', function () {
    mutations.setInterfaceRegime()
  })

  // Перемещение кнопки включения интерфейса
  interfaceRegimeOnButtonElement.addEventListener('touchmove', function (event) {
    interfaceRegimeOnButtonElement.style.top = `${event.touches[0].clientY - 25}px`
    interfaceRegimeOnButtonElement.style.left = `${event.touches[0].clientX - 25}px`
  })

  // Включение интерфейса управления
  interfaceRegimeOnButtonElement.addEventListener('touchend', function (event) {
    // Возвращаем кружок на место
    setTimeout(() => {
      interfaceRegimeOnButtonElement.style.top = `unset`
      interfaceRegimeOnButtonElement.style.bottom = `40px`
      interfaceRegimeOnButtonElement.style.left = `calc(50% - 25px)`
    }, 200)

    if (event.changedTouches[0].clientY < 75) {
      mutations.setInterfaceRegime()
    }
  })

  compressorElement.addEventListener('input', function (event) {
    const parameter = event.target.classList[0].split('-')[1]
    mutations.audio.setCompressorParameter(parameter, parseFloat(event.value || event.target.value))
  })

  LFOElement.addEventListener('input', function (event) {
    if (event.target.name === 'lfo') {
      mutations.audio.setLFOParameter('enabled', event.target.value)
    } else if (event.target.name === 'lfo-wave') {
      mutations.audio.setLFOParameter('type', event.target.options[event.target.selectedIndex].text)
    } else {
      mutations.audio.setLFOParameter(String(event.target.name), parseFloat(event.value || event.target.value))
    }
  })

  // Обработка изменения input-значений через слайд
  // У каждого инпута есть атрибут slide, который определяет соотношение
  // кол-во пикселей / 1 пункт input-поля
  slideElements.forEach(slideElement => {
    let initialClientX = 0 // Изначальное положение курсора мыши после клика
    let initialInputValue = 0 // Изначальное значение инпут-поля, которое будем изменять
    let currentInputElement = null // Поле, которое изменяем

    function slideHandler(event) {
      // Имитируем input-событие
      let inputEvent = new Event('input', { bubbles: true })

      // С кастомным полем value (то есть не нативное target.value!),
      // в котором к исходному значению поля прибавляем вычисленное
      // и делим на атрибут slide
      inputEvent.value = toFixedNumber(
        Number(initialInputValue) + (Number(((event.clientX || event.touches[0].clientX) - initialClientX) / currentInputElement.attributes.slide.value) * currentInputElement.attributes.step.value),
        currentInputElement.attributes.coefficient.value
      )

      currentInputElement.dispatchEvent(inputEvent)
    }

    slideElement.addEventListener('mousedown', function (event) {
      currentInputElement = this.querySelector('input')

      initialClientX = event.clientX
      initialInputValue = currentInputElement.value

      bodyElement.addEventListener('mousemove', slideHandler)

      bodyElement.addEventListener('mouseup', function (event) {
        bodyElement.removeEventListener('mousemove', slideHandler)
      })
    })

    slideElement.addEventListener('touchstart', function (event) {
      currentInputElement = this.querySelector('input')

      initialClientX = event.touches[0].clientX
      initialInputValue = currentInputElement.value

      this.addEventListener('touchmove', slideHandler)

      bodyElement.addEventListener('touchend', function (event) {
        bodyElement.removeEventListener('touchmove', slideHandler)
      })
    })
  })

  // Заполняем интерфейс дефолтными данными
  syncSettingsFrontend(settings)

  // Настраиваем компрессор
  updateCompressorSettings(settings.audio.compressor)

  // Если в URL есть ?remote, то сразу переключаем в соответствующий режим
  const markerFromURL = document.location.search.slice(1)

  if (markerFromURL === 'remote') {
    settings.audio.synthesisRegime = 'remote'
    document.querySelector('#remote').checked = true

    if (!socketIsInit) {
      socketInit()

      socket.connect()

      // По обновлению объекта настроек
      socket.on('settings message', (settingsData) => {
        Object.assign(settings, settingsData) // Обновляем объект
        syncSettingsFrontend(settingsData) // Обновляем input-поля
      })

      // Вешаем слушатели вебсокет-событий
      socket.on('connect', () => {
        connectionsToServer.textContent = language.connection.ready
        connectionsToServer.classList.remove('connections--wait', 'connections--error')
        connectionsToServer.classList.add('connections--ready')
      })

      socket.on('disconnect', () => {
        connectionsToServer.textContent = language.connection.failed
        connectionsToServer.classList.remove('connections--wait', 'connections--ready')
        connectionsToServer.classList.add('connections--error')
      })
    }

    mutations.audio.setSynthesisRegime('remote')
  }
}

// Функция синхронизирует настройки со смартфона с десктопом
function syncSettings() {
  if (socketIsInit) {
    socket.emit('settings message', settings)
  }

  syncSettingsFrontend(settings)
}

// Управление горячими клавишами
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    // Sensor
    case 'BracketLeft': thresholdElement.focus()
      break
    case 'BracketRight': timeoutElement.focus()
      break

    // Oscillator
    case 'KeyQ':
      // Если дошли до конца списка
      if (waveElement.options.selectedIndex + 1 === waveElement.options.length) waveElement.options.selectedIndex = -1
      mutations.audio.setWaveType(waveElement.options[++waveElement.options.selectedIndex].text)
      break
    case 'KeyW': attackElement.focus()
      break
    case 'KeyE': gainElement.focus()
      break
    case 'KeyR': releaseElement.querySelector('.release').focus()
      break
    case 'KeyT': attenuationElement.querySelector('.attenuation').focus()
      break
    case 'Escape':
      document.querySelector('#off').dispatchEvent(new Event('change', { bubbles: true }))
      break

    // Frequency range
    case 'Semicolon':
      if (settings.audio.frequencyRegime === 'continuous') {
        frequenciesRangeElement.querySelector('.frequencies-range-from').focus()
      }
      if (settings.audio.frequencyRegime === 'tempered') {
        notesRangeElement.querySelector('.notes-range-from').focus()
      }

      break
    case 'Quote':
      if (settings.audio.frequencyRegime === 'continuous') {
        frequenciesRangeElement.querySelector('.frequencies-range-to').focus()
      }
      if (settings.audio.frequencyRegime === 'tempered') {
        notesRangeElement.querySelector('.notes-range-to').focus()
      }

      break

    // Filter
    case 'Period': filterElement.focus()
      break
    case 'Slash': factorElement.focus()
      break

    // LFO
    case 'KeyA':
      // Меняем на противоположное значение
      if (settings.audio.LFO.enabled === true) {
        mutations.audio.setLFOParameter('enabled', 'false')
        LFOElement.querySelector('#lfo-on').checked = false
      } else if (settings.audio.LFO.enabled === false) {
        mutations.audio.setLFOParameter('enabled', 'true')
        LFOElement.querySelector('#lfo-off').checked = true
      }

      break
    case 'KeyS':
      // Если дошли до конца списка
      if (LFOElement.querySelector('.lfo-wave').options.selectedIndex + 1 === LFOElement.querySelector('.lfo-wave').options.length) LFOElement.querySelector('.lfo-wave').options.selectedIndex = -1
      mutations.audio.setLFOParameter('type', LFOElement.querySelector('.lfo-wave').options[++LFOElement.querySelector('.lfo-wave').options.selectedIndex].text)
      break
    case 'KeyD': LFOElement.querySelector('.rate').focus()
      break
    case 'KeyF': LFOElement.querySelector('.depth').focus()
      break

    // Compressor
    case 'KeyZ': compressorElement.querySelector('.compressor-threshold').focus()
      break
    case 'KeyX': compressorElement.querySelector('.compressor-knee').focus()
      break
    case 'KeyC': compressorElement.querySelector('.compressor-ratio').focus()
      break
    case 'KeyV': compressorElement.querySelector('.compressor-attack').focus()
      break
    case 'KeyB': compressorElement.querySelector('.compressor-release').focus()
      break
  }
})
