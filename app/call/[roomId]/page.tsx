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
import { AlertCircle, Copy, Check, BarChart3, X, Share2, Video, Users, ShieldCheck, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function CallPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const roomId = params.roomId as string
  const [userId] = useState(() => `user_${Math.random().toString(36).substring(2, 11)}`)
  const [userName, setUserName] = useState('Misafir')
  const [isCreating, setIsCreating] = useState(false)
  const [devices, setDevices] = useState({ audio: '', video: '', quality: '720p' as VideoQuality })

  // Auth check & Modern URL handling
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Görüşmeye katılmak için giriş yapmalısınız', {
          id: 'auth-required',
          icon: <Lock className="h-4 w-4" />
        })
        router.replace('/')
        return
      }
      setUserName(user.email?.split('@')[0] || 'Kullanıcı')
    }

    checkAuth()

    const createParam = searchParams.get('create') === 'true'
    const audio = searchParams.get('audioDevice') || ''
    const video = searchParams.get('videoDevice') || ''
    const q = (searchParams.get('quality') as VideoQuality) || '720p'
    const name = searchParams.get('userName') || 'Misafir'

    // IsCreating bilgisini koru (Refresh yapınca kaybolmaması için)
    if (searchParams.has('create')) {
      sessionStorage.setItem(`isCreating_${roomId}`, createParam.toString())
      setIsCreating(createParam)
    } else {
      const persistedIsCreating = sessionStorage.getItem(`isCreating_${roomId}`) === 'true'
      setIsCreating(persistedIsCreating)
    }

    setDevices({ audio, video, quality: q })
    if (name !== 'Misafir') setUserName(name)

    // URL'deki teknik parametreleri gizle
    if (searchParams.has('create') || searchParams.has('audioDevice')) {
      router.replace(`/call/${roomId}`, { scroll: false })
    }
  }, [searchParams, roomId, router])

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
  const [isPeerOnline, setIsPeerOnline] = useState(false)

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
      // Sadece cihazlar set edildikten sonra (ya da varsayılanla) başlat
      try {
        const stream = await MediaDeviceManager.getUserMedia(
          devices.audio,
          devices.video,
          devices.quality
        )
        setLocalStream(stream)
      } catch (err) {
        setError('Medya cihazlarına erişilemedi. Lütfen izinleri kontrol edin.')
      }
    }

    if (devices.audio !== undefined) {
      initializeStream()
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [devices])

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

      // Presence tabanlı anlık bağlantı: Karşı taraf online olduğu an el sıkışmayı başlat
      signaling.onPeerStatus((isOnline) => {
        if (!mounted) return
        setIsPeerOnline(isOnline)

        if (isOnline && isCreating && pc.iceConnectionState !== 'connected') {
          console.log('Presence: Peer detected online, triggering handshake')
          pc.onnegotiationneeded?.(new Event('negotiationneeded'))
        }
      })

      signaling.onMessage(async (message: SignalingMessage) => {
        if (!mounted) return

        if (message.type === 'peer-joined' && isCreating && pc.iceConnectionState !== 'connected') {
          console.log('Creator: Peer joined via signaling, starting handshake')
          try {
            const offer = await pc.createOffer({ iceRestart: true })
            await pc.setLocalDescription(offer)
            signaling?.sendOffer(pc.localDescription!)
          } catch (err) {
            console.error('Handshake failed:', err)
          }
          return
        }

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
      {/* Header - More compact and subtle */}
      <div className="border-b bg-card/50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-2 sm:py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-medium leading-none sm:text-base">
                  {connectionState === 'connected' ? 'Görüşme Yayında' : 'Bağlantı Kuruluyor'}
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                    {userName}
                  </span>
                  {isCreating && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary animate-in fade-in zoom-in duration-500">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      YÖNETİCİ
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCopyRoomId}
                className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors sm:text-xs"
              >
                <span className="font-mono">{formatRoomId(roomId)}</span>
                {copied ? (
                  <Check className="h-2.5 w-2.5 text-success" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 mr-2 lg:flex">
              <ConnectionStatusBadge state={connectionState} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 gap-2 px-3 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Paylaş</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQualityStats(!showQualityStats)}
              className="hidden h-8 w-8 p-0 lg:flex"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Video Area */}
        <div className="relative flex flex-1 flex-col p-2 sm:p-6 bg-slate-50/50 dark:bg-slate-950/20">
          {error && (
            <Alert variant="destructive" className="mx-auto mb-4 max-w-2xl animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {connectionState !== 'connected' && !remoteStream && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="text-center p-8 bg-card border rounded-3xl shadow-2xl max-w-sm animate-in zoom-in-95 duration-300">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className={`absolute inset-0 animate-ping rounded-full ${isPeerOnline ? 'bg-emerald-500/20' : 'bg-primary/20'}`} />
                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed ${isPeerOnline ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-primary bg-primary/5 text-primary'}`}>
                      {isPeerOnline ? <Users className="h-8 w-8" /> : <Video className="h-8 w-8" />}
                    </div>
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-bold">
                  {isPeerOnline ? 'Katılımcı Geldi!' : (isCreating ? 'Oda Hazır' : 'Bağlantı Bekleniyor')}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isPeerOnline
                    ? 'Diğer kullanıcı odaya girdi, şu an bağlantı kuruluyor. Lütfen bekleyin...'
                    : (isCreating
                      ? 'Oda ID\'nizi paylaşın ve katılımcının odaya girmesini bekleyin.'
                      : 'Oda sahibine bağlanılmaya çalışılıyor...')}
                </p>

                {!isPeerOnline && isCreating && (
                  <div className="mt-8 pt-6 border-t flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-2 font-mono text-sm">
                      {formatRoomId(roomId)}
                    </div>
                    <Button variant="default" size="sm" onClick={handleShare} className="gap-2 w-full">
                      <Share2 className="h-4 w-4" />
                      Davet Linkini Paylaş
                    </Button>
                  </div>
                )}

                {isPeerOnline && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-600 font-medium">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Sinyal Bekleniyor...
                  </div>
                )}
              </div>
            </div>
          )}

          {showQualityStats && connectionState === 'connected' && (
            <div className="mx-auto mb-4 w-full max-w-5xl">
              <ConnectionQualityIndicator quality={connectionQuality} />
            </div>
          )}

          <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4">
            {/* Remote Video Container - Restricted size on desktop */}
            <div className="relative aspect-video w-full max-h-[75vh] min-h-[300px] overflow-hidden rounded-2xl border bg-black shadow-2xl transition-all duration-500">
              <VideoPlayer
                stream={remoteStream}
                userName={callState.remoteUserId || undefined}
                className="h-full w-full object-cover"
              />

              {/* Floating Status Bar inside Video */}
              {connectionState === 'connected' && (
                <div className="absolute left-4 top-4 z-10 hidden sm:block">
                  <ConnectionStatusBadge state={connectionState} />
                </div>
              )}
            </div>

            {/* Local Pip (Picture in Picture) - More stylish */}
            <div className="absolute bottom-4 right-4 z-30 w-28 overflow-hidden rounded-xl border-2 border-background shadow-2xl transition-all duration-300 hover:scale-105 sm:bottom-6 sm:right-6 sm:w-40 lg:w-56">
              <VideoPlayer
                stream={localStream}
                muted
                mirrored
                userName="Siz"
                className="aspect-video"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-center sm:mt-8">
            <div className="rounded-2xl bg-card/80 p-2 shadow-lg backdrop-blur-md border">
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
          </div>
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
