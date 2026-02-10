'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeviceSelector } from '@/components/device-selector'
import { PermissionRequest } from '@/components/permission-request'
import { MediaDeviceManager } from '@/lib/webrtc/media-devices'
import { VideoQuality, VIDEO_QUALITY_PRESETS } from '@/lib/webrtc/config'
import { formatRoomId } from '@/lib/utils/room'
import { Video, Settings, AlertCircle, ArrowRight, ArrowLeft, Share2, Mic, MicOff, User } from 'lucide-react'
import { useAudioLevel } from '@/hooks/use-audio-level'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function SetupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)

  const roomId = searchParams.get('roomId') || ''
  const isCreating = searchParams.get('create') === 'true'

  const [showPermissionRequest, setShowPermissionRequest] = useState(true)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('')
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('720p')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [user, setUser] = useState<any>(null)
  const audioLevel = useAudioLevel(stream)

  // Get user profile from local storage
  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('webrtc_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      } else {
        setUser(null)
      }
    }

    checkUser()
    window.addEventListener('local-auth-changed', checkUser)
    return () => window.removeEventListener('local-auth-changed', checkUser)
  }, [])

  // Check WebRTC support
  useEffect(() => {
    if (!MediaDeviceManager.isWebRTCSupported()) {
      setError('Tarayıcınız WebRTC desteklemiyor. Lütfen modern bir tarayıcı kullanın.')
    }
  }, [])

  // Load devices
  useEffect(() => {
    if (!permissionsGranted) return

    const loadDevices = async () => {
      try {
        setIsLoading(true)
        const allDevices = await MediaDeviceManager.getDevices()
        setDevices(allDevices)

        // Set default devices
        const audioDevices = allDevices.filter((d) => d.kind === 'audioinput')
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')

        if (audioDevices.length > 0) {
          setSelectedAudioDevice(audioDevices[0].deviceId)
        }
        if (videoDevices.length > 0) {
          setSelectedVideoDevice(videoDevices[0].deviceId)
        }
      } catch (err) {
        setError('Cihazlar yüklenirken hata oluştu. Lütfen izinleri kontrol edin.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [permissionsGranted])

  // Request permissions and start preview
  useEffect(() => {
    if (!permissionsGranted || !selectedAudioDevice || !selectedVideoDevice) return

    const startPreview = async () => {
      try {
        // Stop existing stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }

        const newStream = await MediaDeviceManager.getUserMedia(
          selectedAudioDevice,
          selectedVideoDevice,
          selectedQuality
        )

        setStream(newStream)
        setError('')

        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }

        // Reload devices to get labels
        const updatedDevices = await MediaDeviceManager.getDevices()
        setDevices(updatedDevices)
      } catch (err) {
        setError('Kamera ve mikrofon erişimi reddedildi. Lütfen tarayıcı izinlerini kontrol edin.')
      }
    }

    startPreview()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [selectedAudioDevice, selectedVideoDevice, selectedQuality, permissionsGranted])

  const handlePermissionsGranted = () => {
    setShowPermissionRequest(false)
    setPermissionsGranted(true)
  }

  const handlePermissionsDenied = () => {
    setPermissionsGranted(false)
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
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
      window.open(waUrl, '_blank')
    }
  }

  const handleJoinCall = async () => {
    if (!user) {
      setError('Görüşmeye katılmak için önce giriş yapmalısınız.')
      toast.error('Giriş yapmanız gerekiyor')
      return
    }

    if (!permissionsGranted) {
      setError('Devam etmek için kamera ve mikrofon izinlerini vermelisiniz.')
      return
    }

    // Register room in Supabase if creating
    if (isCreating) {
      try {
        const { supabase } = await import('@/lib/supabase')
        await supabase
          .from('rooms')
          .upsert({ room_id: roomId, status: 'active' }, { onConflict: 'room_id' })
      } catch (err) {
        console.error('Failed to register room:', err)
        // We continue even if DB registration fails, but log it
      }
    }

    // Navigate to call page with selected devices
    const params = new URLSearchParams({
      roomId,
      audioDevice: selectedAudioDevice,
      videoDevice: selectedVideoDevice,
      quality: selectedQuality,
      create: isCreating.toString(),
      userName: user?.name || 'Misafir',
    })

    router.push(`/call/${roomId}?${params.toString()}`)
  }

  if (showPermissionRequest) {
    return (
      <PermissionRequest
        onPermissionsGranted={handlePermissionsGranted}
        onPermissionsDenied={handlePermissionsDenied}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Görüşmeye Hazırlan</h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-base">
              Cihazlarını kontrol et ve bağlan.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            Vazgeç
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Video Preview */}
          <Card className="overflow-hidden border-none shadow-lg outline outline-1 outline-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Önizleme
                </CardTitle>
                <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  Oda: {formatRoomId(roomId)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                {permissionsGranted ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover video-mirror"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Kamera izni bekleniyor...
                      </p>
                    </div>
                  </div>
                )}

                {/* Audio Level Visualizer Overlay */}
                {stream && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-black/40 p-2 backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                      {audioLevel > 5 ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Mikrofon Testi</div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-primary transition-all duration-75"
                          style={{ width: `${Math.min(100, (audioLevel / 128) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Device Settings */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-none shadow-md lg:border lg:shadow-none">
              <CardHeader className="py-4 sm:py-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cihaz Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <DeviceSelector
                  type="audioinput"
                  selectedDeviceId={selectedAudioDevice}
                  onDeviceChange={setSelectedAudioDevice}
                  devices={devices}
                />

                <DeviceSelector
                  type="videoinput"
                  selectedDeviceId={selectedVideoDevice}
                  onDeviceChange={setSelectedVideoDevice}
                  devices={devices}
                />

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Video Kalitesi</Label>
                  <Select
                    value={selectedQuality}
                    onValueChange={(value) => setSelectedQuality(value as VideoQuality)}
                  >
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="1080p">1080p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Floating Action Bar for Mobile & Regular Card for Desktop */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 p-4 backdrop-blur-lg lg:relative lg:border-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none transition-all animate-in slide-in-from-bottom-full duration-500">
              <Card className="border-primary/20 bg-primary/5 shadow-2xl lg:shadow-inner">
                <CardHeader className="hidden pb-2 lg:block">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    {isCreating ? 'Oda Hazır' : 'Bağlanmaya Hazırsınız'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 lg:p-6">
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      onClick={handleJoinCall}
                      size="lg"
                      className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg"
                      disabled={!permissionsGranted || isLoading}
                    >
                      {isCreating ? 'Odayı Başlat' : 'Görüşmeye Katıl'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      onClick={handleShare}
                      size="lg"
                      variant="outline"
                      className="h-12 w-12 sm:h-14 sm:w-14 p-0 shadow-md"
                      title="Bağlantıyı Paylaş"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <SetupPageContent />
    </Suspense>
  )
}
