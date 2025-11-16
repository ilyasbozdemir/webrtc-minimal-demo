'use client'

import { useEffect, useRef } from 'react'
import { User } from 'lucide-react'

interface VideoPlayerProps {
  stream: MediaStream | null
  muted?: boolean
  mirrored?: boolean
  userName?: string
  className?: string
}

export function VideoPlayer({
  stream,
  muted = false,
  mirrored = false,
  userName,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const isVideoEnabled = stream?.getVideoTracks().some((track) => track.enabled) ?? false

  return (
    <div className={`video-container relative overflow-hidden rounded-lg bg-muted ${className}`}>
      {isVideoEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${mirrored ? 'video-mirror' : ''}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/20 sm:mb-3 sm:h-16 sm:w-16 lg:h-20 lg:w-20">
              <User className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {userName || 'Kamera kapalı'}
            </p>
          </div>
        </div>
      )}

      {userName && (
        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm sm:bottom-3 sm:left-3 sm:px-3 sm:py-1.5">
          <p className="text-xs font-medium text-white sm:text-sm">{userName}</p>
        </div>
      )}
    </div>
  )
}
