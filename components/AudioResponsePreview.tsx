"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioResponsePreviewProps {
  audioUrl: string
  className?: string
}

export function AudioResponsePreview({ audioUrl, className = "" }: AudioResponsePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
      setIsLoading(false)
    })

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      audio.pause()
      audio.src = ""
      audio.removeEventListener("loadedmetadata", () => {})
      audio.removeEventListener("timeupdate", () => {})
      audio.removeEventListener("ended", () => {})
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className={`flex items-center gap-2 p-2 bg-gray-800 rounded-lg ${className}`}>
      <Button
        onClick={togglePlayPause}
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-full p-0 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1">
        <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-[#2DAD71] transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{isLoading ? "--:--" : formatTime(duration)}</span>
        </div>
      </div>

      <Volume2 className="h-4 w-4 text-gray-400" />
    </div>
  )
}
