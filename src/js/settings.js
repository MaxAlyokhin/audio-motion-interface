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
      console.log(settings.sound.toneDuration)
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
  },
}

export function settingsInit() {
  // Вешаем логику на интерфейс управления

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
    mutations.sound.setDuration(this.value)
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
