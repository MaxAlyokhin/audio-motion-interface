import { settings } from './settings'
import { orientationToFrequency } from './helpers'
import { pitchDetection } from './notes'
import { countElement, isAudioElement } from './audio'

let midi = null // MIDI object
let currentMIDIPort = null
let currentMIDIChannel = 0

export function midiInit() {
  function onMIDISuccess(midiAccess) {
    midi = midiAccess

    // Find all the ports, collect their IDs and write them in <option>
    for (const entry of midi.outputs) {
      const output = entry[1]
      midiSelectPortElement.append(new Option(`ID: ${output.id} | Manufacturer: ${output.manufacturer ? output.manufacturer : 'No name'} | Name: ${output.name}`, output.id))
    }

    // Connect to the first port on the list
    if (midiSelectPortElement.options[0]) {
      settings.midi.noMIDIPortsFound = false
      currentMIDIPort = midi.outputs.get(midiSelectPortElement.options[0].value)
      modulation(settings.midi.modulation)
    } else {
      settings.midi.noMIDIPortsFound = true
    }
  }

  function onMIDIFailure(error) {
    throw new Error(`Failed to get MIDI access: ${error}`)
  }

  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
  } else {
    throw new Error(`MIDI is not supported on this browser.`)
  }

  // UI

  // MIDI port selection element
  const midiSelectPortElement = document.querySelector('.midi__select-port')

  // MIDI port selection control
  midiSelectPortElement.addEventListener('change', function () {
    currentMIDIPort = midi.outputs.get(this.options[this.selectedIndex].value)
    modulation(settings.midi.modulation)
  })

  // MIDI channel selection element
  const midiSelectChannelElement = document.querySelector('.midi__select-channel')

  // MIDI channel selection control
  midiSelectChannelElement.addEventListener('change', function () {
    currentMIDIChannel = Number(this.options[this.selectedIndex].value)
    modulation(settings.midi.modulation)
  })

  // MIDI reset control
  document.querySelector('#midi-reset').addEventListener('change', function() {
    allSoundOff()

    for (let entry of playingNotes.entries()) {
      if (entry[1]) clearTimeout(entry[1][1])
    }

    playingNotes.clear()

    settings.ui.lite ? false : (countElement.textContent = playingNotes.size)
    isAudioElement.textContent = 'false'
    isAudioElement.classList.remove('motion__is-audio--yes')

    setTimeout(() => {
      this.checked = false
    }, 2000)
  })
}

// MIDI messages

// Controlled by sensors
function noteOff(note, velocity) {
  currentMIDIPort.send([0x80 + currentMIDIChannel, note, velocity])
}

function noteOn(note, velocity) {
  currentMIDIPort.send([0x90 + currentMIDIChannel, note, velocity])
}

function afterTouchChannel(pressure) {
  currentMIDIPort.send([0xd0 + currentMIDIChannel, pressure])
}

function pitch(value) {
  currentMIDIPort.send([0xe0 + currentMIDIChannel, value & 0x7f, value >> 7])
}

// Controlled by UI
function allSoundOff() {
  currentMIDIPort.send([0xb0 + currentMIDIChannel, 0x78, 0])
}

export function modulation(value) {
  currentMIDIPort.send([0xb0 + currentMIDIChannel, 0x01, value])
}

let note = null

function orientationToNote(orientation) {
  if (settings.audio.frequencyRegime === 'tempered') {
    note = settings.audio.notesRange.from + Math.floor(orientation * ((settings.audio.notesRange.to - settings.audio.notesRange.from) / 180))
  }

  return note
}

/**
 * Returns a velocity
 * @param {Number} motionMaximum - maximum speed
 * @return {Number} velocity value from 0 to 127
 */

let velocity = null
function getVelocity(motionMaximum) {
  if (settings.motion.gainGeneration === true) {
    velocity = (motionMaximum / settings.motion.threshold) * settings.midi.velocity + 1
    return velocity <= 127 ? velocity : 127
  } else {
    return settings.midi.velocity
  }
}

let frequency = null
let previousFrequency = null // To work more efficiently with DOM updates
const frequencyElement = document.querySelector('.motion__frequency')

// System timeout
let audioTimeoutIsOff = true

let motionIsOff = true // Marker for the last motion event

let previousMotionMaximum = 0

// Data structure to control all played notes
// Key - number of the note to be played
// Value - array [velocity, timeoutID, pitch]
const playingNotes = new Map()

let newNote = null
let previousNote = null
let dataForPitch = []
let pitchValue = null



// The function goes around all the notes and checks if a timeout is set for it to call noteoff()
function checkTimeoutsInActiveNotes() {
  for (let entry of playingNotes.entries()) {
    if (entry[1][1] === undefined) {
      playingNotes.get(entry[0])[1] = setTimeout(
        (note) => {
          noteOff(note, playingNotes.get(note)[0])
          playingNotes.delete(note)

          settings.ui.lite ? false : (countElement.textContent = playingNotes.size)

          if (playingNotes.size < 120) countElement.classList.remove('warning')
          if (playingNotes.size === 0) {
            isAudioElement.textContent = 'false'
            isAudioElement.classList.remove('motion__is-audio--yes')
          }
        },
        settings.midi.duration * 1000,
        entry[0]
      )
    }
  }
}

/**
 * Called for each motion event
 * @param {Object} motion - motion object
 * @fires MIDIMessage
 */

export function fireMIDI(motion) {

  frequency = orientationToFrequency(motion.orientation)

  // Update the DOM only when the value changes
  if (previousFrequency !== frequency) {
    settings.ui.lite ? false : (frequencyElement.textContent = frequency)
    previousFrequency = frequency
  }

  // Translate frequency into a note
  if (settings.audio.frequencyRegime === 'continuous') {
    dataForPitch = pitchDetection(frequency)
    // The pitch value in MIDI is from 0 to 16383, 8191 is the normal state (middle)
    // 8192 divisions are two semitones, so one semitone is 4096 divisions
    // We want to make a smooth transition between halftones, so we need to define a shift up to 4096
    // dataForPitch[1] is how many percent of the base note up
    pitchValue = Math.floor((dataForPitch[1] / 100) * 4096) + 8191
  } else {
    pitchDetection(frequency)
  }

  // Cutoff is exceeded — the movement has begun
  if (motion.isMotion && audioTimeoutIsOff) {
    if (motionIsOff) {
      motionIsOff = false

      if (playingNotes.size === 0) {
        isAudioElement.textContent = 'true'
        isAudioElement.classList.add('motion__is-audio--yes')
      }

      settings.ui.lite ? false : (countElement.textContent = playingNotes.size)
      if (playingNotes.size >= 120) countElement.classList.add('warning')
    }

    if (settings.motion.thresholdType === 'up-to-peak') {
      // Find the speed peak and go to the branch else
      if (motion.maximum <= previousMotionMaximum) {
        motionIsOff = false
        audioTimeoutIsOff = false
      } else {
        previousMotionMaximum = motion.maximum
      }
    }

    if (settings.motion.thresholdType === 'full') {
      if (settings.audio.frequencyRegime === 'continuous') {
        newNote = dataForPitch[0]
      }

      if (settings.audio.frequencyRegime === 'tempered') {
        newNote = orientationToNote(motion.orientation) // Calculate the note
      }

      // Is there such a note already?
      if (playingNotes.has(newNote)) {
        // If there is a timeout, it means that the note was already released and must be played again, cancelling the timeout.
        if (playingNotes.get(newNote)[1]) {

          checkTimeoutsInActiveNotes()

          playingNotes.get(newNote)[0] = getVelocity(motion.maximum) // Renewing Velocity
          clearTimeout(playingNotes.get(newNote)[1]) // Deleting a scheduled timeout
          noteOn(newNote, playingNotes.get(newNote)[0]) // Playing a note
          playingNotes.get(newNote).pop() // Deleting the timeout
          // Add pitch to the note
          if (settings.audio.frequencyRegime === 'continuous') {
            pitch(pitchValue)
          }
        } else {
          previousNote = newNote // Memorizing the previous one

          // Change only the aftertouch in speed influence mode
          if (settings.motion.gainGeneration) {
            afterTouchChannel(getVelocity(motion.maximum))
          } else {
            // Add pitch to the note
            if (settings.audio.frequencyRegime === 'continuous') {
              pitch(pitchValue)
            }
            return
          }
        }
      }
      // New note
      else {
        // Add it and play
        playingNotes.set(newNote, [getVelocity(motion.maximum)])
        noteOn(newNote, playingNotes.get(newNote)[0])

        // Check if the previous note has a timeout. If not, then put
        if (previousNote !== newNote && playingNotes.get(previousNote) && !playingNotes.get(previousNote)[1]) {
          playingNotes.get(previousNote)[1] = setTimeout(
            (note) => {
              noteOff(note, playingNotes.get(note)[0])
              playingNotes.delete(note)

              settings.ui.lite ? false : (countElement.textContent = playingNotes.size)

              if (playingNotes.size < 120) countElement.classList.remove('warning')
              if (playingNotes.size === 0) {
                isAudioElement.textContent = 'false'
                isAudioElement.classList.remove('motion__is-audio--yes')
              }
            },
            settings.midi.duration * 1000,
            previousNote
          )
        }

        settings.ui.lite ? false : (countElement.textContent = playingNotes.size)
      }
    }
  } else if (!motionIsOff) {
    motionIsOff = true // The movement is over
    audioTimeoutIsOff = false // Put a timeout against accidental movements after that

    if (settings.motion.thresholdType === 'up-to-peak') {
      if (settings.audio.frequencyRegime === 'continuous') {
        newNote = dataForPitch[0]
      }

      if (settings.audio.frequencyRegime === 'tempered') {
        newNote = orientationToNote(motion.orientation) // Calculate the note
      }

      if (playingNotes.has(newNote)) {
        playingNotes.get(newNote)[0] = getVelocity(previousMotionMaximum)
        clearTimeout(playingNotes.get(newNote)[1])
        noteOn(newNote, playingNotes.get(newNote)[0])

        if (settings.audio.frequencyRegime === 'continuous') {
          pitch(pitchValue)
        }

        // If there was a repeat and the old timeout is cleared, then you must put the new timeout there
        playingNotes.get(newNote)[1] = setTimeout(
          (note) => {
            noteOff(note, playingNotes.get(note)[0])
            playingNotes.delete(note)

            settings.ui.lite ? false : (countElement.textContent = playingNotes.size)

            if (playingNotes.size < 120) countElement.classList.remove('warning')
            if (playingNotes.size === 0) {
              isAudioElement.textContent = 'false'
              isAudioElement.classList.remove('motion__is-audio--yes')
            }
          },
          settings.midi.duration * 1000,
          newNote
        )
      }
      // There are no repetitions of this note
      else {
        // Add it and play
        playingNotes.set(newNote, [getVelocity(previousMotionMaximum)])
        noteOn(newNote, playingNotes.get(newNote)[0])

        if (settings.audio.frequencyRegime === 'continuous') {
          pitch(pitchValue)
        }

        // Immediately put a timeout on noteOff
        playingNotes.get(newNote)[1] = setTimeout(
          (note) => {
            noteOff(note, playingNotes.get(note)[0])
            playingNotes.delete(note)

            settings.ui.lite ? false : (countElement.textContent = playingNotes.size)

            if (playingNotes.size < 120) countElement.classList.remove('warning')
            if (playingNotes.size === 0) {
              isAudioElement.textContent = 'false'
              isAudioElement.classList.remove('motion__is-audio--yes')
            }
          },
          settings.midi.duration * 1000,
          newNote
        )
      }

      settings.ui.lite ? false : (countElement.textContent = playingNotes.size)

      previousMotionMaximum = 0
    }

    if (settings.motion.thresholdType === 'full') {
      checkTimeoutsInActiveNotes()
    }

    setTimeout(() => {
      audioTimeoutIsOff = true
    }, settings.motion.timeout)
  }
}
