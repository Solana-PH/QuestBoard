const frequencies: Record<string, number> = {
  d5: 587.33, // Originally 1174.66
  c5: 523.25, // Originally 1046.5
  g4: 475.0, // Originally 950
  'a#3': 233.08, // Originally 466.16
  a4: 220.0, // Originally 440.0
  // g4: 196.0, // Originally 392.0
  'f#3': 185.0, // Originally 370.0
  b3: 246.94, // Originally 493.88
  e4: 329.63, // Originally 659.25
  '-': 0,
}

const tempo = 140
const halfNoteDuration = 2 * (60 / tempo)
const quarterNoteDuration = 60 / tempo
const sixteenthNoteDuration = quarterNoteDuration / 4
const thirtySecondNoteDuration = quarterNoteDuration / 8
const eighthNoteDuration = quarterNoteDuration / 2

const notes = [
  { note: 'd5', duration: thirtySecondNoteDuration },
  { note: '-', duration: thirtySecondNoteDuration },
  { note: 'd5', duration: thirtySecondNoteDuration },
  { note: '-', duration: thirtySecondNoteDuration },
  { note: 'd5', duration: thirtySecondNoteDuration },
  { note: '-', duration: thirtySecondNoteDuration },
  { note: 'd5', duration: quarterNoteDuration },
  { note: 'g4', duration: quarterNoteDuration },
  { note: 'c5', duration: quarterNoteDuration },
  { note: 'd5', duration: sixteenthNoteDuration },
  { note: '-', duration: eighthNoteDuration },
  { note: 'c5', duration: sixteenthNoteDuration },
  { note: 'd5', duration: halfNoteDuration },
]

export function playAlertSound(volume: number = 0.1) {
  const audioContext = new window.AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = 'sine'
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  let currentTime = audioContext.currentTime

  notes.forEach((note) => {
    oscillator.frequency.setValueAtTime(frequencies[note.note], currentTime)
    gainNode.gain.setValueAtTime(volume, currentTime)
    currentTime += note.duration
    gainNode.gain.setValueAtTime(0, currentTime)
  })

  oscillator.start()
  oscillator.stop(currentTime)
}
