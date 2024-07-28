const frequencies: Record<string, number> = {
  d6: 1174.66,
  c6: 1046.5,
  g5: 950,
  'a#': 466.16,
  a: 440.0,
  g: 392.0,
  'f#': 370.0,
  b: 493.88,
  e: 659.25,
  '-': 0,
}

const tempo = 140
const halfNoteDuration = 2 * (60 / tempo)
const quarterNoteDuration = 60 / tempo
const sixteenthNoteDuration = quarterNoteDuration / 4
const thirtySecondNoteDuration = quarterNoteDuration / 8
const eighthNoteDuration = quarterNoteDuration / 2

const notes = [
  { note: 'd6', duration: thirtySecondNoteDuration },
  { note: '-', duration: thirtySecondNoteDuration },
  { note: 'd6', duration: thirtySecondNoteDuration },
  { note: '-', duration: thirtySecondNoteDuration },
  { note: 'd6', duration: thirtySecondNoteDuration },
  { note: '-', duration: thirtySecondNoteDuration },
  { note: 'd6', duration: quarterNoteDuration },
  { note: 'g5', duration: quarterNoteDuration },
  { note: 'c6', duration: quarterNoteDuration },
  { note: 'd6', duration: sixteenthNoteDuration },
  { note: '-', duration: eighthNoteDuration },
  { note: 'c6', duration: sixteenthNoteDuration },
  { note: 'd6', duration: halfNoteDuration },
]

export function playAlertSound(volume: number = 0.1) {
  const audioContext = new window.AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = 'square'
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
