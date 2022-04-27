// Настройки системы
export let settings = {
  motion: {
    threshold: 1,
  },
  sound: {
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
  },
}

export const mutations = {
  motion: {
    setThreshold: (threshold) => {
      settings.motion.threshold = threshold
    },
  },
  sound: {
    setWaveType: (waveType) => {
      settings.sound.oscillatorType = String(waveType)
    },
    setDuration: (duration) => {
      settings.sound.toneDuration = duration
    },
    setFrequencyFactor: (frequencyFactor) => {
      settings.sound.frequencyFactor = frequencyFactor
    },
    setBiquadFilterFrequency: (biquadFilterFrequency) => {
      settings.sound.biquadFilterFrequency = biquadFilterFrequency
    },
    setAttenuation: (attenuation) => {
      settings.sound.attenuation = attenuation
    },
    setGain: (gain) => {
      settings.sound.gain = gain
    },
    setOscillatorRegime: (oscillatorRegime) => {
      settings.sound.oscillatorRegime = oscillatorRegime
    },
    setDataRegime: (dataRegime) => {
      settings.sound.dataRegime = dataRegime
    },
    setAxis: (axis) => {
      if (axis === 'alpha') {
        settings.sound.axis.alpha = !settings.sound.axis.alpha
      }
      if (axis === 'beta') {
        settings.sound.axis.beta = !settings.sound.axis.beta
      }
      if (axis === 'gamma') {
        settings.sound.axis.gamma = !settings.sound.axis.gamma
      }
    },
  },
}

export function settingsInit() {
  // Вешаем логику на интерфейс управления

  let oscillatorRegimeElement = document.querySelector('.oscillator-regime')
  oscillatorRegimeElement.addEventListener('change', function (event) {
    mutations.sound.setOscillatorRegime(event.target.value)
  })

  let dataRegimeElement = document.querySelector('.data-regime')
  dataRegimeElement.addEventListener('change', function (event) {
    mutations.sound.setDataRegime(event.target.value)
  })

  let axisElement = document.querySelector('.axis')
  axisElement.addEventListener('change', function (event) {
    mutations.sound.setAxis(event.target.value)
  })

  let thresholdElement = document.querySelector('.threshold')
  thresholdElement.addEventListener('input', function () {
    mutations.motion.setThreshold(this.value)
  })

  let waveElement = document.querySelector('.wave')
  waveElement.addEventListener('change', function () {
    mutations.sound.setWaveType(this.options[this.selectedIndex].text)
  })

  let durationElement = document.querySelector('.duration')
  durationElement.addEventListener('input', function () {
    mutations.sound.setDuration(parseFloat(this.value))
    console.log(settings.sound.toneDuration)
  })

  let factorElement = document.querySelector('.factor')
  factorElement.addEventListener('input', function () {
    mutations.sound.setFrequencyFactor(this.value)
  })

  let filterElement = document.querySelector('.filter')
  filterElement.addEventListener('input', function () {
    mutations.sound.setBiquadFilterFrequency(this.value)
  })

  let attenuationElement = document.querySelector('.attenuation')
  attenuationElement.addEventListener('input', function () {
    mutations.sound.setAttenuation(this.value)
  })

  let gainElement = document.querySelector('.gain')
  gainElement.addEventListener('input', function () {
    mutations.sound.setGain(this.value)
  })
}
