// Здесь инициализируется объект настроек
// Он изменяется через мутации
// Мутации запускаются по событиям интерфейса управления
// и синхронизируют настройки по вебсокету с удалённым десктопом

import { socketInit, socketIsInit, socket } from './websocket'

// Элементы настроек
let durationElement = null
let attenuationElement = null
let frequenciesRangeElement = null
let notesRangeElement = null
let synthesisRegimeElement = null
let frequencyRegimeElement = null
let thresholdElement = null
let waveElement = null
let filterElement = null
let attackElement = null
let gainElement = null
let gainGenerationOptionElement = null
let gainGenerationElement = null
let liteElement = null
let interfaceRegimeElement = null
let containerElement = null
let interfaceRegimeOnElement = null
let interfaceRegimeOnButtonElement = null
let connectionsToServer = null

window.addEventListener('DOMContentLoaded', () => {
  synthesisRegimeElement = document.querySelector('.synthesis-regime')
  frequencyRegimeElement = document.querySelector('.frequency-regime')
  thresholdElement = document.querySelector('.threshold')
  waveElement = document.querySelector('.wave')
  filterElement = document.querySelector('.filter')
  attackElement = document.querySelector('.attack')
  gainElement = document.querySelector('.gain')
  durationElement = document.querySelector('.duration-container')
  attenuationElement = document.querySelector('.attenuation-container')
  frequenciesRangeElement = document.querySelector('.frequencies-range')
  notesRangeElement = document.querySelector('.notes-range')
  gainGenerationOptionElement = document.querySelector('.gain-generation')
  gainGenerationElement = document.querySelector('.gain-generation__container')
  liteElement = document.querySelector('.lite__container')
  interfaceRegimeElement = document.querySelector('.interface-regime')
  containerElement = document.querySelector('.container')
  interfaceRegimeOnElement = document.querySelector('.interface-regime-on')
  interfaceRegimeOnButtonElement = document.querySelector('.interface-regime-on__button')
  connectionsToServer = document.querySelector('.connections__to-server')
})

// Функция синхронизирует настройки со смартфона с десктопом
function syncSettings() {
  if (socketIsInit) {
    socket.emit('settings message', settings)
  }
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

  if (settings.motion.gainGeneration === true) {
    document.querySelector('#speedgain-yes').checked = true
  }
  if (settings.motion.gainGeneration === false) {
    document.querySelector('#speedgain-no').checked = true
  }

  if (settings.lite === false) {
    liteElement.querySelector('#lite-no').checked = true
  }
  if (settings.lite === true) {
    liteElement.querySelector('#lite-yes').checked = true
  }

  frequenciesRangeElement.querySelector('.frequencies-range-from').value = settings.audio.frequenciesRange.from
  frequenciesRangeElement.querySelector('.frequencies-range-to').value = settings.audio.frequenciesRange.to
  notesRangeElement.querySelector('.notes-range-from').value = settings.audio.notesRange.from
  notesRangeElement.querySelector('.notes-range-to').value = settings.audio.notesRange.to
  thresholdElement.value = settings.motion.threshold
  waveElement.value = settings.audio.oscillatorType
  filterElement.value = settings.audio.biquadFilterFrequency
  attackElement.value = settings.audio.attack
  gainElement.value = settings.audio.gain
  durationElement.querySelector('.duration').value = settings.audio.toneDuration
  attenuationElement.querySelector('.attenuation').value = settings.audio.attenuation
}

// Настройки системы
export let settings = {
  lite: false,
  interfaceRegime: true,
  motion: {
    threshold: 1.0,
    gainGeneration: true,
  },
  audio: {
    toneDuration: 1.2,
    oscillatorType: 'sine',
    biquadFilterFrequency: 600.0,
    attenuation: 0.0001,
    attack: 0,
    gain: 0.08,
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
  },
}

// Мутации
export const mutations = {
  setLite: (value) => {
    value === 'true' ? (settings.lite = true) : (settings.lite = false)
    syncSettings()
  },

  setInterfaceRegime: () => {
    settings.interfaceRegime = !settings.interfaceRegime

    if (settings.interfaceRegime) {
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
      isNaN(threshold) ? (settings.motion.threshold = 0) : (settings.motion.threshold = threshold)
      syncSettings()
    },

    setGainGeneration: (value) => {
      value === 'true' ? (settings.motion.gainGeneration = true) : (settings.motion.gainGeneration = false)
      syncSettings()
    },
  },

  audio: {
    setWaveType: (waveType) => {
      settings.audio.oscillatorType = String(waveType)
      syncSettings()
    },

    setDuration: (duration) => {
      // 0.05 - минимальная длина тона, которую можно погасить без пиков
      isNaN(duration) || duration === 0 ? (settings.audio.toneDuration = 0.05) : (settings.audio.toneDuration = duration)
      syncSettings()
    },

    setBiquadFilterFrequency: (biquadFilterFrequency) => {
      isNaN(biquadFilterFrequency)
        ? (settings.audio.biquadFilterFrequency = 0)
        : (settings.audio.biquadFilterFrequency = biquadFilterFrequency)
      syncSettings()
    },

    setAttenuation: (attenuation) => {
      isNaN(attenuation) ? (settings.audio.attenuation = 0) : (settings.audio.attenuation = attenuation)
      syncSettings()
    },

    setAttack: (attack) => {
      isNaN(attack) ? (settings.audio.attack = 0) : (settings.audio.attack = attack)
      syncSettings()
    },

    setGain: (gain) => {
      isNaN(gain) ? (settings.audio.gain = 0) : (settings.audio.gain = gain)
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
        if (isNaN(frequency)) {
          settings.audio.frequenciesRange.from = 0
        } else if (frequency > 24000 || frequency >= settings.audio.frequenciesRange.to) {
          settings.audio.frequenciesRange.from = settings.audio.frequenciesRange.to - 1
        } else {
          settings.audio.frequenciesRange.from = frequency
        }
      }
      if (rangeType === 'to') {
        if (isNaN(frequency)) {
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
        if (isNaN(note)) {
          settings.audio.notesRange.from = 0
        } else if (note > 138 || note >= settings.audio.notesRange.to) {
          settings.audio.notesRange.from = settings.audio.notesRange.to - 1
        } else {
          settings.audio.notesRange.from = note
        }
      }
      if (rangeType === 'to') {
        if (isNaN(note)) {
          settings.audio.notesRange.to = 0
        } else if (note > 138) {
          settings.audio.notesRange.to = 138
        } else if (note <= settings.audio.notesRange.from) {
          settings.audio.notesRange.to = settings.audio.notesRange.from + 1
        } else {
          settings.audio.notesRange.to = note
        }
      }

      syncSettings()
    },
  },
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
        connectionsToServer.textContent = 'Связь с вебсокет-сервером установлена'
        connectionsToServer.classList.remove('connections--wait', 'connections--error')
        connectionsToServer.classList.add('connections--ready')
      })

      socket.on('disconnect', () => {
        connectionsToServer.textContent = 'Связь с вебсокет-сервером потеряна'
        connectionsToServer.classList.remove('connections--wait', 'connections--ready')
        connectionsToServer.classList.add('connections--error')
      })
    }

    mutations.audio.setSynthesisRegime(event.target.value)
  })

  frequencyRegimeElement.addEventListener('change', function (event) {
    mutations.audio.setFrequencyRegime(event.target.value)
  })

  thresholdElement.addEventListener('input', function () {
    mutations.motion.setThreshold(parseFloat(this.value))
  })

  gainGenerationElement.addEventListener('change', function (event) {
    mutations.motion.setGainGeneration(event.target.value)
  })

  frequenciesRangeElement.addEventListener('input', function (event) {
    if (event.target.classList[0] === 'frequencies-range-from') {
      mutations.audio.setFrequencyRange('from', parseFloat(event.target.value))
    }
    if (event.target.classList[0] === 'frequencies-range-to') {
      mutations.audio.setFrequencyRange('to', parseFloat(event.target.value))
    }
  })

  notesRangeElement.addEventListener('input', function (event) {
    if (event.target.classList[0] === 'notes-range-from') {
      mutations.audio.setNoteRange('from', parseFloat(event.target.value))
    }
    if (event.target.classList[0] === 'notes-range-to') {
      mutations.audio.setNoteRange('to', parseFloat(event.target.value))
    }
  })

  waveElement.addEventListener('change', function () {
    mutations.audio.setWaveType(this.options[this.selectedIndex].text)
  })

  durationElement.addEventListener('input', function (event) {
    mutations.audio.setDuration(parseFloat(event.target.value))
  })

  filterElement.addEventListener('input', function () {
    mutations.audio.setBiquadFilterFrequency(parseFloat(this.value))
  })

  attenuationElement.addEventListener('input', function (event) {
    mutations.audio.setAttenuation(parseFloat(event.target.value))
  })

  attackElement.addEventListener('input', function () {
    this.value != 0 ? gainGenerationOptionElement.classList.add('inactive') : gainGenerationOptionElement.classList.remove('inactive')
    mutations.audio.setAttack(parseFloat(this.value))
  })

  gainElement.addEventListener('input', function () {
    mutations.audio.setGain(parseFloat(this.value))
  })

  liteElement.addEventListener('change', function (event) {
    mutations.setLite(event.target.value)
  })

  // Выключение интерфейса управления
  interfaceRegimeElement.addEventListener('click', function () {
    mutations.setInterfaceRegime()
  })

  // Перемещение кнопки включения интерфейса
  interfaceRegimeOnButtonElement.addEventListener('touchmove', function (event) {
    interfaceRegimeOnButtonElement.style.top = `${event.touches[0].pageY - 25}px`
    interfaceRegimeOnButtonElement.style.left = `${event.touches[0].pageX - 25}px`
  })

  // Включение интерфейса управления
  interfaceRegimeOnButtonElement.addEventListener('touchend', function (event) {
    // Возвращаем кружок на место
    setTimeout(() => {
      interfaceRegimeOnButtonElement.style.top = `unset`
      interfaceRegimeOnButtonElement.style.bottom = `40px`
      interfaceRegimeOnButtonElement.style.left = `calc(50% - 25px)`
    }, 200)

    if (event.changedTouches[0].pageY < 75) {
      mutations.setInterfaceRegime()
    }
  })

  // Заполняем интерфейс дефолтными данными
  syncSettingsFrontend(settings)
}
