"use client"

import { useEffect, useRef } from "react"

const AudioWaveform = ({ state = "idle" }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Set wave properties
      const baseAmplitude = 50
      const frequency = 0.015
      const speed = state === "recording" || state === "playing" ? 0.12 : 0

      // Update time for animation
      if (speed > 0) {
        timeRef.current += speed
      }

      // Draw the sine wave with complex variations
      ctx.beginPath()
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3
      ctx.lineCap = "round"

      for (let x = 0; x <= width; x++) {
        // Complex sine wave variations with long 30-second cycles
        const time = timeRef.current

        // Multiple overlapping sine waves with different periods
        const amp1 = Math.sin(x * 0.003 + time * 0.2) * 0.15
        const amp2 = Math.sin(x * 0.007 + time * 0.35) * 0.1
        const amp3 = Math.sin(x * 0.012 + time * 0.15) * 0.08
        const amp4 = Math.sin(x * 0.002 + time * 0.05) * 0.12

        const amplitudeVariation = 0.85 + amp1 + amp2 + amp3 + amp4
        const currentAmplitude = baseAmplitude * amplitudeVariation

        // Complex frequency variations with long cycles
        const freq1 = Math.sin(x * 0.004 + time * 0.18) * 0.12
        const freq2 = Math.sin(x * 0.008 + time * 0.25) * 0.08
        const freq3 = Math.sin(x * 0.001 + time * 0.03) * 0.15

        const frequencyVariation = 1 + freq1 + freq2 + freq3
        const currentFrequency = frequency * frequencyVariation

        const y = height / 2 + Math.sin(x * currentFrequency + timeRef.current) * currentAmplitude

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Continue animation if recording or playing
      if (state === "recording" || state === "playing") {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation
    animate()

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state])

  return (
    <div className="w-full p-8 md:p-8 p-0">
      <canvas ref={canvasRef} width={800} height={120} className="w-full h-auto md:rounded rounded-none" />
    </div>
  )
}

export default AudioWaveform
