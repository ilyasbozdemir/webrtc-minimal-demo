'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from '@/components/video-player'
import { CallControls } from '@/components/call-controls'
import { ChatPanel } from '@/components/chat-panel'
import { ConnectionStatusBadge } from '@/components/connection-status-badge'
import { ConnectionQualityIndicator } from '@/components/connection-quality-indicator'
import { WebRTCPeerConnection } from '@/lib/webrtc/peer-connection'
import { MediaDeviceManager } from '@/lib/webrtc/media-devices'
import { SupabaseSignaling } from '@/lib/webrtc/supabase-signaling'
import { SignalingMessage } from '@/lib/webrtc/local-signaling'
import { VideoQuality } from '@/lib/webrtc/config'
import { ConnectionState, CallState } from '@/lib/types/webrtc'
import { formatRoomId } from '@/lib/utils/room'
import { useChat } from '@/hooks/use-chat'
import { useConnectionQuality } from '@/hooks/use-connection-quality'
import { AlertCircle, Copy, Check, BarChart3, X, Share2 } from 'lucide-react'

function CallPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const roomId = params.roomId as string
  const audioDevice = searchParams.get('audioDevice') || ''
  const videoDevice = searchParams.get('videoDevice') || ''
  const quality = (searchParams.get('quality') as VideoQuality) || '720p'
  const isCreating = searchParams.get('create') === 'true'

  const [userId] = useState(() => `user_${Math.random().toString(36).substring(2, 11)}`)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [callState, setCallState] = useState<CallState>({
    isAudioEnabled: true,
    isVideoEnabled: true,
    connectionState: 'idle',
    roomId: roomId,
    remoteUserId: null,
  })
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showQualityStats, setShowQualityStats] = useState(false)
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null)

  const peerConnectionRef = useRef<WebRTCPeerConnection | null>(null)
  const signalingRef = useRef<SupabaseSignaling | null>(null)
  const makingOfferRef = useRef(false)
  const ignoreOfferRef = useRef(false)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const processedMessagesRef = useRef<Set<string>>(new Set())

  const { messages, sendMessage, isReady: isChatReady } = useChat({ dataChannel })

  const { quality: connectionQuality } = useConnectionQuality({
    peerConnection: peerConnectionRef.current,
    isConnected: connectionState === 'connected',
  })

  useEffect(() => {
    const initializeStream = async () => {
      try {
        const stream = await MediaDeviceManager.getUserMedia(
          audioDevice,
          videoDevice,
          quality
        )
        setLocalStream(stream)
      } catch (err) {
        setError('Medya cihazlarına erişilemedi. Lütfen izinleri kontrol edin.')
      }
    }

    initializeStream()

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!localStream) return

    let mounted = true
    let peerConnection: WebRTCPeerConnection | null = null
    let signaling: SupabaseSignaling | null = null

    const initializeConnection = async () => {
      if (!mounted) return

      console.log('Initializing connection. isCreating:', isCreating, 'userId:', userId)
      setConnectionState('connecting')

      peerConnection = new WebRTCPeerConnection()
      peerConnectionRef.current = peerConnection

      const pc = peerConnection.initializePeerConnection()
      peerConnection.setLocalStream(localStream)

      if (isCreating) {
        const dc = peerConnection.getDataChannel()
        if (dc) {
          dc.onopen = () => {
            console.log('DataChannel opened')
            if (mounted) setDataChannel(dc)
          }
          dc.onclose = () => {
            console.log('DataChannel closed')
            if (mounted) setDataChannel(null)
          }
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (!mounted) return
        const iceState = pc.iceConnectionState
        console.log('ICE connection state:', iceState)

        if (iceState === 'connected' || iceState === 'completed') {
          console.log('ICE connection established!')
          setConnectionState('connected')
        } else if (iceState === 'checking') {
          setConnectionState('connecting')
        } else if (iceState === 'disconnected') {
          setConnectionState('disconnected')
        } else if (iceState === 'failed') {
          setConnectionState('failed')
          setError('Bağlantı başarısız oldu. Lütfen tekrar deneyin.')
        }
      }

      pc.onconnectionstatechange = () => {
        if (!mounted) return
        const state = peerConnection?.getConnectionState()
        console.log('Connection state:', state)

        if (state === 'connected') {
          setConnectionState('connected')
        } else if (state === 'connecting') {
          setConnectionState('connecting')
        } else if (state === 'disconnected') {
          setConnectionState('disconnected')
        } else if (state === 'failed') {
          setConnectionState('failed')
          setError('Bağlantı başarısız oldu. Lütfen tekrar deneyin.')
        }
      }

      pc.ontrack = (event) => {
        if (!mounted) return
        console.log('Remote track received:', event.track.kind)
        const [remoteStream] = event.streams
        setRemoteStream(remoteStream)
        peerConnection?.setRemoteStream(remoteStream)
        setCallState(prev => ({ ...prev, remoteUserId: 'Remote User' }))
      }

      pc.ondatachannel = (event) => {
        if (!mounted) return
        console.log('Incoming DataChannel received')
        const incomingChannel = event.channel
        peerConnection?.setDataChannel(incomingChannel)

        incomingChannel.onopen = () => {
          console.log('Incoming DataChannel opened')
          if (mounted) setDataChannel(incomingChannel)
        }

        incomingChannel.onclose = () => {
          console.log('Incoming DataChannel closed')
          if (mounted) setDataChannel(null)
        }
      }

      signaling = new SupabaseSignaling(roomId, userId)
      signalingRef.current = signaling

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate')
          signaling?.sendIceCandidate(event.candidate)
        }
      }

      signaling.onMessage(async (message: SignalingMessage) => {
        if (!mounted) return

        const messageKey = `${message.from}-${message.type}-${message.id}`
        if (processedMessagesRef.current.has(messageKey)) {
          return
        }

        if (message.from === userId) {
          return
        }

        console.log('Processing message:', message.type, 'from:', message.from)
        processedMessagesRef.current.add(messageKey)

        try {
          if (message.type === 'peer-joined' && isCreating && pc.iceConnectionState !== 'connected') {
            console.log('Creator: Peer joined, re-starting negotiation (Handshake)')
            const offer = await pc.createOffer({ iceRestart: true })
            await pc.setLocalDescription(offer)
            signaling?.sendOffer(pc.localDescription!)
            return
          }

          if (message.type === 'ice-candidate') {
            if (message.candidate) {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate))
                console.log('ICE candidate added')
              } else {
                pendingCandidatesRef.current.push(message.candidate)
              }
            }
            return
          }

          if (message.type === 'offer') {
            if (isCreating) {
              console.log('Creator ignoring offer')
              return
            }

            console.log('Joiner processing offer')
            await pc.setRemoteDescription(new RTCSessionDescription(message.offer!))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            signaling?.sendAnswer(answer)
            console.log('Answer sent')

            if (pendingCandidatesRef.current.length > 0) {
              for (const candidate of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate))
                } catch (err) {
                  console.error('Error adding pending candidate:', err)
                }
              }
              pendingCandidatesRef.current = []
            }
          } else if (message.type === 'answer') {
            if (!isCreating) {
              console.log('Joiner ignoring answer')
              return
            }

            console.log('Creator processing answer')
            await pc.setRemoteDescription(new RTCSessionDescription(message.answer!))

            if (pendingCandidatesRef.current.length > 0) {
              for (const candidate of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate))
                } catch (err) {
                  console.error('Error adding pending candidate:', err)
                }
              }
              pendingCandidatesRef.current = []
            }
          }
        } catch (err) {
          console.error('Error handling signaling message:', err)
          processedMessagesRef.current.delete(messageKey)
          if (mounted) setError('Sinyal işleme hatası oluştu.')
        }
      })

      if (isCreating) {
        pc.onnegotiationneeded = async () => {
          if (!mounted) return
          try {
            console.log('Creator: negotiation needed')
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            signaling?.sendOffer(pc.localDescription!)
          } catch (err) {
            console.error('Error during negotiation:', err)
          }
        }
      }

      // Handshake initiate
      setTimeout(() => {
        if (mounted) signaling?.sendJoin()
      }, 1500)
    }

    initializeConnection()

    return () => {
      mounted = false
      console.log('Cleaning up connection')
      processedMessagesRef.current.clear()
      if (signaling) signaling.close()
      if (peerConnection) peerConnection.close()
    }
  }, [localStream, roomId, isCreating, userId])

  const handleToggleAudio = () => {
    if (peerConnectionRef.current && localStream) {
      const newState = !callState.isAudioEnabled
      peerConnectionRef.current.toggleAudio(newState)
      setCallState((prev) => ({ ...prev, isAudioEnabled: newState }))
    }
  }

  const handleToggleVideo = () => {
    if (peerConnectionRef.current && localStream) {
      const newState = !callState.isVideoEnabled
      peerConnectionRef.current.toggleVideo(newState)
      setCallState((prev) => ({ ...prev, isVideoEnabled: newState }))
    }
  }

  const handleEndCall = () => {
    if (peerConnectionRef.current) peerConnectionRef.current.close()
    if (localStream) localStream.getTracks().forEach((track) => track.stop())
    router.push('/')
  }

  const handleReconnect = () => {
    setConnectionState('reconnecting')
    setTimeout(() => {
      setConnectionState('connected')
    }, 2000)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/setup?roomId=${roomId}`
    const text = `Görüntülü görüşme odasına katıl: ${formatRoomId(roomId)}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Video Görüşme Daveti',
          text: text,
          url: url,
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      // Fallback: Copy to clipboard and show toast or alert
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      // Custom WhatsApp link as fallback if share API is not available
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
      window.open(waUrl, '_blank')
    }
  }

  const handleCopyRoomId = async () => {
    await navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <h1 className="text-sm font-semibold sm:text-lg">Video Görüşme</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyRoomId}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors sm:text-sm"
                >
                  <span className="font-mono">{formatRoomId(roomId)}</span>
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQualityStats(!showQualityStats)}
              className="hidden lg:flex"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              İstatistikler
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Paylaş</span>
            </Button>
            <ConnectionStatusBadge state={connectionState} />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Video Area */}
        <div className="flex flex-1 flex-col p-2 sm:p-4">
          {error && (
            <Alert variant="destructive" className="mb-2 sm:mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {connectionState === 'connecting' && !remoteStream && (
            <Alert className="mb-2 sm:mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bağlantı bekleniyor</AlertTitle>
              <AlertDescription>
                {isCreating
                  ? 'Oda ID\'nizi paylaşın ve karşı tarafın bağlanmasını bekleyin.'
                  : 'Oda sahibine bağlanılıyor...'}
              </AlertDescription>
            </Alert>
          )}

          {showQualityStats && connectionState === 'connected' && (
            <div className="mb-2 hidden sm:mb-4 lg:block">
              <ConnectionQualityIndicator quality={connectionQuality} />
            </div>
          )}

          <div className="relative flex flex-1 flex-col gap-2 sm:gap-4">
            {/* Remote Video - Takes full space on mobile */}
            <div className="relative flex-1 overflow-hidden rounded-lg">
              <VideoPlayer
                stream={remoteStream}
                userName={callState.remoteUserId || undefined}
                className="h-full w-full"
              />
            </div>

            <div className="absolute right-2 top-2 z-10 w-24 overflow-hidden rounded-lg shadow-lg sm:right-4 sm:top-4 sm:w-32 lg:w-48">
              <VideoPlayer
                stream={localStream}
                muted
                mirrored
                userName="Siz"
                className="aspect-video"
              />
            </div>
          </div>

          <div className="mt-2 sm:mt-4">
            <CallControls
              isAudioEnabled={callState.isAudioEnabled}
              isVideoEnabled={callState.isVideoEnabled}
              onToggleAudio={handleToggleAudio}
              onToggleVideo={handleToggleVideo}
              onEndCall={handleEndCall}
              onReconnect={connectionState === 'failed' ? handleReconnect : undefined}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
            />
          </div>

          {connectionState === 'connected' && (
            <div className="mt-2 sm:mt-4 lg:hidden">
              <ConnectionQualityIndicator quality={connectionQuality} />
            </div>
          )}
        </div>

        {isChatOpen && (
          <>
            {/* Mobile: Full screen overlay */}
            <div className="fixed inset-0 z-50 bg-background lg:hidden">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b bg-card px-4 py-3">
                  <h2 className="font-semibold">Sohbet</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ChatPanel
                  messages={messages}
                  onSendMessage={sendMessage}
                  onClose={() => setIsChatOpen(false)}
                  isChatReady={isChatReady}
                  hideCloseButton
                />
              </div>
            </div>

            {/* Desktop: Sidebar */}
            <div className="hidden w-80 border-l bg-card lg:block lg:w-96">
              <ChatPanel
                messages={messages}
                onSendMessage={sendMessage}
                onClose={() => setIsChatOpen(false)}
                isChatReady={isChatReady}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CallPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Bağlantı kuruluyor...</p>
        </div>
      </div>
    }>
      <CallPageContent />
    </Suspense>
  )
}
