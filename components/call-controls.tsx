'use client'

import { Button } from '@/components/ui/button'
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onEndCall: () => void
  onReconnect?: () => void
  onToggleChat?: () => void
  isChatOpen?: boolean
  className?: string
}

export function CallControls({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onReconnect,
  onToggleChat,
  isChatOpen,
  className,
}: CallControlsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
      {/* Audio Toggle */}
      <Button
        size="lg"
        variant={isAudioEnabled ? 'secondary' : 'destructive'}
        onClick={onToggleAudio}
        className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
        aria-label={isAudioEnabled ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
      >
        {isAudioEnabled ? (
          <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
        <span className="sr-only">
          {isAudioEnabled ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
        </span>
      </Button>

      {/* Video Toggle */}
      <Button
        size="lg"
        variant={isVideoEnabled ? 'secondary' : 'destructive'}
        onClick={onToggleVideo}
        className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
        aria-label={isVideoEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
      >
        {isVideoEnabled ? (
          <Video className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
        <span className="sr-only">
          {isVideoEnabled ? 'Kamerayı kapat' : 'Kamerayı aç'}
        </span>
      </Button>

      {/* End Call */}
      <Button
        size="lg"
        variant="destructive"
        onClick={onEndCall}
        className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
        aria-label="Aramayı sonlandır"
      >
        <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Aramayı sonlandır</span>
      </Button>

      {/* Reconnect */}
      {onReconnect && (
        <Button
          size="lg"
          variant="secondary"
          onClick={onReconnect}
          className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
          aria-label="Yeniden bağlan"
        >
          <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Yeniden bağlan</span>
        </Button>
      )}

      {/* Chat Toggle */}
      {onToggleChat && (
        <Button
          size="lg"
          variant={isChatOpen ? 'default' : 'secondary'}
          onClick={onToggleChat}
          className="h-12 w-12 rounded-full sm:h-14 sm:w-14"
          aria-label="Sohbeti aç/kapat"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Sohbeti aç/kapat</span>
        </Button>
      )}
    </div>
  )
}
