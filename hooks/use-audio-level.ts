import { useState, useEffect } from 'react'

export function useAudioLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!stream) {
      setLevel(0)
      return
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    let animationFrameId: number

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      setLevel(average)
      animationFrameId = requestAnimationFrame(updateLevel)
    }

    updateLevel()

    return () => {
      cancelAnimationFrame(animationFrameId)
      audioContext.close()
    }
  }, [stream])

  return level
}
