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
import { Video, Settings, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'

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

  const handleJoinCall = async () => {
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <h1 className="text-3xl font-bold">Cihaz Kurulumu</h1>
          <p className="mt-2 text-muted-foreground">
            Görüşmeye başlamadan önce kamera ve mikrofon ayarlarınızı yapın
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Kamera Önizleme
              </CardTitle>
              <CardDescription>
                Oda: <span className="font-mono font-semibold">{formatRoomId(roomId)}</span>
              </CardDescription>
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cihaz Ayarları
                </CardTitle>
                <CardDescription>
                  Kullanmak istediğiniz cihazları seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <Label>Video Kalitesi</Label>
                  <Select
                    value={selectedQuality}
                    onValueChange={(value) => setSelectedQuality(value as VideoQuality)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480p">
                        480p (Düşük bant genişliği)
                      </SelectItem>
                      <SelectItem value="720p">
                        720p (Önerilen)
                      </SelectItem>
                      <SelectItem value="1080p">
                        1080p (Yüksek kalite)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Seçili: {VIDEO_QUALITY_PRESETS[selectedQuality].width.ideal}x
                    {VIDEO_QUALITY_PRESETS[selectedQuality].height.ideal} @{' '}
                    {VIDEO_QUALITY_PRESETS[selectedQuality].frameRate.ideal}fps
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isCreating ? 'Oda Oluşturuluyor' : 'Odaya Katılıyorsunuz'}
                </CardTitle>
                <CardDescription>
                  {isCreating
                    ? 'Oda ID\'nizi karşı tarafa gönderin ve bağlantı kurmasını bekleyin.'
                    : 'Oda sahibinin bağlantı kurmasını bekleyin.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleJoinCall}
                  size="lg"
                  className="w-full"
                  disabled={!permissionsGranted || isLoading}
                >
                  {isCreating ? 'Oda Oluştur ve Bekle' : 'Görüşmeye Katıl'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
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
