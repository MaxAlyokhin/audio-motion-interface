import { getDate } from './helpers'
import { settings, syncSettings } from './settings'

const importElement = document.querySelector('.import')
const exportElement = document.querySelector('.export')

const reader = new FileReader()

// The function fully validates the incoming object from the client
function checkSettings(settingsFromClient) {
  if (!settingsFromClient.motion) throw new Error('AMI settings file validation error: motion object invalid or missing')
  if (!(typeof settingsFromClient.motion.threshold === 'number' && settingsFromClient.motion.threshold >= 0)) throw new Error('AMI settings file validation error: motion.threshold invalid or missing')
  if (!(typeof settingsFromClient.motion.thresholdType === 'string' && settingsFromClient.motion.thresholdType === 'full' || settingsFromClient.motion.thresholdType === 'up-to-peak')) throw new Error('AMI settings file validation error: motion.thresholdType invalid or missing')
  if (!(typeof settingsFromClient.motion.timeout === 'number' && settingsFromClient.motion.timeout >= 0)) throw new Error('AMI settings file validation error: motion.timeout invalid or missing')
  if (!(settingsFromClient.motion.gainGeneration === true || settingsFromClient.motion.gainGeneration === false)) throw new Error('AMI settings file validation error: motion.gainGeneration invalid or missing')
  if (!(typeof settingsFromClient.motion.semiSphere === 'string' && settingsFromClient.motion.semiSphere === 'left' || settingsFromClient.motion.semiSphere === 'right')) throw new Error('AMI settings file validation error: motion.semiSphere invalid or missing')
  if (!settingsFromClient.audio) throw new Error('AMI settings file validation error: audio object invalid or missing')
  if (!(typeof settingsFromClient.audio.attack === 'number' && settingsFromClient.audio.attack >= 0)) throw new Error('AMI settings file validation error: audio.attack invalid or missing')
  if (!(typeof settingsFromClient.audio.release === 'number' && settingsFromClient.audio.release >= 0.05)) throw new Error('AMI settings file validation error: audio.release invalid or missing')
  if (!(typeof settingsFromClient.audio.gain === 'number' && settingsFromClient.audio.gain >= 0)) throw new Error('AMI settings file validation error: audio.gain invalid or missing')
  if (!(typeof settingsFromClient.audio.oscillatorType === 'string' && settingsFromClient.audio.oscillatorType === 'sine' || settingsFromClient.audio.oscillatorType === 'square' || settingsFromClient.audio.oscillatorType === 'sawtooth' || settingsFromClient.audio.oscillatorType === 'triangle')) throw new Error('AMI settings file validation error: audio.oscillatorType invalid or missing')
  if (!(typeof settingsFromClient.audio.biquadFilterFrequency === 'number' && settingsFromClient.audio.biquadFilterFrequency >= 0 && settingsFromClient.audio.biquadFilterFrequency <= 24000)) throw new Error('AMI settings file validation error: audio.biquadFilterFrequency invalid or missing')
  if (!(typeof settingsFromClient.audio.biquadFilterQ === 'number' && settingsFromClient.audio.biquadFilterQ >= 0.0001 && settingsFromClient.audio.biquadFilterQ <= 1000)) throw new Error('AMI settings file validation error: audio.biquadFilterQ invalid or missing')
  if (!(typeof settingsFromClient.audio.attenuation === 'number' && settingsFromClient.audio.attenuation >= 0.00001)) throw new Error('AMI settings file validation error: audio.attenuation invalid or missing')
  if (!(typeof settingsFromClient.audio.frequencyRegime === 'string' && settingsFromClient.audio.frequencyRegime === 'continuous' || settingsFromClient.audio.frequencyRegime === 'tempered')) throw new Error('AMI settings file validation error: audio.frequencyRegime invalid or missing')
  if (!settingsFromClient.audio.frequenciesRange) throw new Error('AMI settings file validation error: audio.frequenciesRange invalid or missing')
  if (!(typeof settingsFromClient.audio.frequenciesRange.from === 'number' && settingsFromClient.audio.frequenciesRange.from >= 0 && (settingsFromClient.audio.frequenciesRange.from <= 24000 && settingsFromClient.audio.frequenciesRange.from < settingsFromClient.audio.frequenciesRange.to))) throw new Error('AMI settings file validation error: audio.frequenciesRange.from invalid or missing')
  if (!(typeof settingsFromClient.audio.frequenciesRange.to === 'number' && settingsFromClient.audio.frequenciesRange.to >= 0 && (settingsFromClient.audio.frequenciesRange.to <= 24000 && settingsFromClient.audio.frequenciesRange.to > settingsFromClient.audio.frequenciesRange.from))) throw new Error('AMI settings file validation error: audio.frequenciesRange.to invalid or missing')
  if (!settingsFromClient.audio.notesRange) throw new Error('AMI settings file validation error: audio.notesRange invalid or missing')
  if (!(typeof settingsFromClient.audio.notesRange.from === 'number' && settingsFromClient.audio.notesRange.from >= 0 && (settingsFromClient.audio.notesRange.from < 131 && settingsFromClient.audio.notesRange.from < settingsFromClient.audio.notesRange.to))) throw new Error('AMI settings file validation error: audio.notesRange.from invalid or missing')
  if (!(typeof settingsFromClient.audio.notesRange.to === 'number' && settingsFromClient.audio.notesRange.to >= 0 && (settingsFromClient.audio.notesRange.to <= 131 && settingsFromClient.audio.notesRange.to > settingsFromClient.audio.notesRange.from))) throw new Error('AMI settings file validation error: audio.notesRange.to invalid or missing')
  if (!settingsFromClient.audio.compressor) throw new Error('AMI settings file validation error: audio.compressor invalid or missing')
  if (!(typeof settingsFromClient.audio.compressor.threshold === 'number' && settingsFromClient.audio.compressor.threshold <= 0 && settingsFromClient.audio.compressor.threshold >= -100)) throw new Error('AMI settings file validation error: audio.compressor.threshold invalid or missing')
  if (!(typeof settingsFromClient.audio.compressor.knee === 'number' && settingsFromClient.audio.compressor.knee >= 0 && settingsFromClient.audio.compressor.knee <= 40)) throw new Error('AMI settings file validation error: audio.compressor.knee invalid or missing')
  if (!(typeof settingsFromClient.audio.compressor.ratio === 'number' && settingsFromClient.audio.compressor.ratio >= 0 && settingsFromClient.audio.compressor.ratio <= 20)) throw new Error('AMI settings file validation error: audio.compressor.ratio invalid or missing')
  if (!(typeof settingsFromClient.audio.compressor.attack === 'number' && settingsFromClient.audio.compressor.attack >= 0 && settingsFromClient.audio.compressor.attack <= 1)) throw new Error('AMI settings file validation error: audio.compressor.attack invalid or missing')
  if (!(typeof settingsFromClient.audio.compressor.release === 'number' && settingsFromClient.audio.compressor.release >= 0 && settingsFromClient.audio.compressor.release <= 1)) throw new Error('AMI settings file validation error: audio.compressor.release invalid or missing')
  if (!settingsFromClient.audio.LFO) throw new Error('AMI settings file validation error: audio.LFO invalid or missing')
  if (!(typeof settingsFromClient.audio.LFO.rate === 'number' && settingsFromClient.audio.LFO.rate >= 0 && settingsFromClient.audio.LFO.rate <= 24000)) throw new Error('AMI settings file validation error: audio.LFO.rate invalid or missing')
  if (!(typeof settingsFromClient.audio.LFO.depth === 'number' && settingsFromClient.audio.LFO.depth >= 0 && settingsFromClient.audio.LFO.depth <= 1)) throw new Error('AMI settings file validation error: audio.LFO.depth invalid or missing')
  if (!(typeof settingsFromClient.audio.LFO.enabled === 'boolean')) throw new Error('AMI settings file validation error: audio.LFO.enabled invalid or missing')
  if (!(typeof settingsFromClient.audio.LFO.type === 'string' && settingsFromClient.audio.LFO.type === 'sine' || settingsFromClient.audio.LFO.type === 'square' || settingsFromClient.audio.LFO.type === 'sawtooth' || settingsFromClient.audio.LFO.type === 'triangle')) throw new Error('AMI settings file validation error: audio.LFO.type invalid or missing')

  updateSettings(settingsFromClient)
}

function updateSettings(settingsFromClient) {
  settings.motion.threshold = settingsFromClient.motion.threshold
  settings.motion.thresholdType = settingsFromClient.motion.thresholdType
  settings.motion.timeout = settingsFromClient.motion.timeout
  settings.motion.gainGeneration = settingsFromClient.motion.gainGeneration
  settings.motion.semiSphere = settingsFromClient.motion.semiSphere
  settings.audio.attack = settingsFromClient.audio.attack
  settings.audio.release = settingsFromClient.audio.release
  settings.audio.gain = settingsFromClient.audio.gain
  settings.audio.oscillatorType = settingsFromClient.audio.oscillatorType
  settings.audio.biquadFilterFrequency = settingsFromClient.audio.biquadFilterFrequency
  settings.audio.biquadFilterQ = settingsFromClient.audio.biquadFilterQ
  settings.audio.attenuation = settingsFromClient.audio.attenuation
  settings.audio.frequencyRegime = settingsFromClient.audio.frequencyRegime
  settings.audio.frequenciesRange.from = settingsFromClient.audio.frequenciesRange.from
  settings.audio.frequenciesRange.to = settingsFromClient.audio.frequenciesRange.to
  settings.audio.notesRange.from = settingsFromClient.audio.notesRange.from
  settings.audio.notesRange.to = settingsFromClient.audio.notesRange.to
  settings.audio.compressor.threshold = settingsFromClient.audio.compressor.threshold
  settings.audio.compressor.knee = settingsFromClient.audio.compressor.knee
  settings.audio.compressor.ratio = settingsFromClient.audio.compressor.ratio
  settings.audio.compressor.attack = settingsFromClient.audio.compressor.attack
  settings.audio.compressor.release = settingsFromClient.audio.compressor.release
  settings.audio.LFO.rate = settingsFromClient.audio.LFO.rate
  settings.audio.LFO.depth = settingsFromClient.audio.LFO.depth
  settings.audio.LFO.enabled = settingsFromClient.audio.LFO.enabled
  settings.audio.LFO.type = settingsFromClient.audio.LFO.type

  syncSettings()
}

function importJSON(file) {
  if (file.type !== 'application/json') throw new Error('JSON file is required')
  if (file.size / 1024 > 5) throw new Error('A file of up to 5kb is required')

  reader.readAsText(file)

  reader.addEventListener('load', (event) => {
    checkSettings(JSON.parse(event.target.result))
  })

  reader.addEventListener('error', (event) => {
    throw new Error(event.target.error)
  })
}

function exportJSON(settings) {
  const settingsWithoutUI = Object.assign({}, settings)
  delete settingsWithoutUI.ui

  const link = document.createElement('a')

  link.href = URL.createObjectURL(
    new Blob([JSON.stringify(settingsWithoutUI, null, 2)], {
      type: 'application/json',
    })
  )

  link.setAttribute('download', `ami-${getDate()}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function settingsExchangeInit() {
  importElement.addEventListener('change', (event) => {
    if (event.target.files.length === 0) return // Checking that the file has been uploaded
    importJSON(event.target.files[0])
  })

  exportElement.addEventListener('click', () => {
    exportJSON(settings)
  })
}

