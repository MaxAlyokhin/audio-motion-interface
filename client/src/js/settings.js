// Здесь инициализируется объект настроек
// Он изменяется через мутации
// Мутации запускаются по событиям интерфейса управления
// и синхронизируют настройки по вебсокету с удалённым десктопом

import { socketInit, socketIsInit, socket } from './websocket'

// Функция синхронизирует настройки со смартфона с десктопом
function syncSettings() {
  if (socketIsInit) {
    socket.emit('settings message', settings)
  }
}

// Настройки системы
export let settings = {
  motion: {
    threshold: 1,
  },
  audio: {
    toneDuration: 1.2,
    oscillatorType: 'sine',
    frequencyFactor: 20,
    biquadFilterFrequency: 600,
    attenuation: 0.0001,
    gain: 0.08,
    oscillatorRegime: 'plural',
    dataRegime: 'maximum',
    axis: {
      alpha: true,
      beta: false,
      gamma: false,
    },
    synthesisRegime: 'local',
  },
}

export const mutations = {
  motion: {
    setThreshold: (threshold) => {
      settings.motion.threshold = threshold
      syncSettings()
    },
  },
  audio: {
    setWaveType: (waveType) => {
      settings.audio.oscillatorType = String(waveType)
      syncSettings()
    },
    setDuration: (duration) => {
      settings.audio.toneDuration = duration
      syncSettings()
    },
    setFrequencyFactor: (frequencyFactor) => {
      settings.audio.frequencyFactor = frequencyFactor
      syncSettings()
    },
    setBiquadFilterFrequency: (biquadFilterFrequency) => {
      settings.audio.biquadFilterFrequency = biquadFilterFrequency
      syncSettings()
    },
    setAttenuation: (attenuation) => {
      settings.audio.attenuation = attenuation
      syncSettings()
    },
    setGain: (gain) => {
      settings.audio.gain = gain
      syncSettings()
    },
    setOscillatorRegime: (oscillatorRegime) => {
      settings.audio.oscillatorRegime = oscillatorRegime
      syncSettings()
    },
    setDataRegime: (dataRegime) => {
      settings.audio.dataRegime = dataRegime
      syncSettings()
    },
    setAxis: (axis) => {
      if (axis === 'alpha') {
        settings.audio.axis.alpha = !settings.audio.axis.alpha
        syncSettings()
      }
      if (axis === 'beta') {
        settings.audio.axis.beta = !settings.audio.axis.beta
        syncSettings()
      }
      if (axis === 'gamma') {
        settings.audio.axis.gamma = !settings.audio.axis.gamma
        syncSettings()
      }
    },
    setSynthesisRegime: (synthesisRegime) => {
      settings.audio.synthesisRegime = synthesisRegime

      if (settings.audio.synthesisRegime === 'local') {
        socket.disconnect()
      }
      if (settings.audio.synthesisRegime === 'remote') {
        socket.connect()
      }
    },
  },
}

// Связываем обект настроек с интерфейсом управления
export function settingsInit() {
  // Включение веб-сокета на смартфоне
  let synthesisRegimeElement = document.querySelector('.synthesis-regime')
  synthesisRegimeElement.addEventListener('change', function (event) {
    if (!socketIsInit) {
      socketInit()
    }

    mutations.audio.setSynthesisRegime(event.target.value)
  })

  let oscillatorRegimeElement = document.querySelector('.oscillator-regime')
  oscillatorRegimeElement.addEventListener('change', function (event) {
    mutations.audio.setOscillatorRegime(event.target.value)
  })

  let dataRegimeElement = document.querySelector('.data-regime')
  dataRegimeElement.addEventListener('change', function (event) {
    mutations.audio.setDataRegime(event.target.value)
  })

  let axisElement = document.querySelector('.axis')
  axisElement.addEventListener('change', function (event) {
    mutations.audio.setAxis(event.target.value)
  })

  let thresholdElement = document.querySelector('.threshold')
  thresholdElement.addEventListener('input', function () {
    mutations.motion.setThreshold(this.value)
  })

  let waveElement = document.querySelector('.wave')
  waveElement.addEventListener('change', function () {
    mutations.audio.setWaveType(this.options[this.selectedIndex].text)
  })

  let durationElement = document.querySelector('.duration')
  durationElement.addEventListener('input', function () {
    mutations.audio.setDuration(parseFloat(this.value))
    console.log(settings.audio.toneDuration)
  })

  let factorElement = document.querySelector('.factor')
  factorElement.addEventListener('input', function () {
    mutations.audio.setFrequencyFactor(this.value)
  })

  let filterElement = document.querySelector('.filter')
  filterElement.addEventListener('input', function () {
    mutations.audio.setBiquadFilterFrequency(this.value)
  })

  let attenuationElement = document.querySelector('.attenuation')
  attenuationElement.addEventListener('input', function () {
    mutations.audio.setAttenuation(this.value)
  })

  let gainElement = document.querySelector('.gain')
  gainElement.addEventListener('input', function () {
    mutations.audio.setGain(this.value)
  })
}
