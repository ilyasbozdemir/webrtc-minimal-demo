'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, CheckCircle2, XCircle, Activity, Globe, Wifi } from 'lucide-react'
import { MediaDeviceManager } from '@/lib/webrtc/media-devices'
import { DEFAULT_ICE_SERVERS } from '@/lib/webrtc/config'

interface ICECandidateInfo {
  type: string
  protocol: string
  address: string
  port: number
  priority: number
  foundation: string
}

export default function DiagnosticsPage() {
  const router = useRouter()
  const [isWebRTCSupported, setIsWebRTCSupported] = useState(false)
  const [hasMediaPermissions, setHasMediaPermissions] = useState<boolean | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [iceCandidates, setIceCandidates] = useState<ICECandidateInfo[]>([])
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [stunTestResult, setStunTestResult] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')

  useEffect(() => {
    checkWebRTCSupport()
    checkMediaPermissions()
  }, [])

  const checkWebRTCSupport = () => {
    const supported = MediaDeviceManager.isWebRTCSupported()
    setIsWebRTCSupported(supported)
  }

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach((track) => track.stop())
      setHasMediaPermissions(true)

      // Load devices
      const allDevices = await MediaDeviceManager.getDevices()
      setDevices(allDevices)
    } catch (error) {
      setHasMediaPermissions(false)
    }
  }

  const testICEConnectivity = async () => {
    setIsTestingConnection(true)
    setStunTestResult('testing')
    setIceCandidates([])

    try {
      const pc = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS })

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate
          const candidateInfo: ICECandidateInfo = {
            type: candidate.type || 'unknown',
            protocol: candidate.protocol || 'unknown',
            address: candidate.address || 'unknown',
            port: candidate.port || 0,
            priority: candidate.priority || 0,
            foundation: candidate.foundation || 'unknown',
          }
          setIceCandidates((prev) => [...prev, candidateInfo])
        }
      }

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          setStunTestResult('success')
          setIsTestingConnection(false)
        }
      }

      // Create a dummy data channel to start ICE gathering
      pc.createDataChannel('test')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Timeout after 10 seconds
      setTimeout(() => {
        if (stunTestResult === 'testing') {
          setStunTestResult('failed')
          setIsTestingConnection(false)
        }
        pc.close()
      }, 10000)
    } catch (error) {
      console.error('ICE connectivity test failed:', error)
      setStunTestResult('failed')
      setIsTestingConnection(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
          <h1 className="text-3xl font-bold">Bağlantı Tanılama</h1>
          <p className="mt-2 text-muted-foreground">
            WebRTC bağlantı kalitesini ve cihaz uyumluluğunu test edin
          </p>
        </div>

        <div className="space-y-6">
          {/* WebRTC Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                WebRTC Desteği
              </CardTitle>
              <CardDescription>Tarayıcı uyumluluğu kontrolü</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {isWebRTCSupported ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium">Destekleniyor</p>
                      <p className="text-sm text-muted-foreground">
                        Tarayıcınız WebRTC'yi tam olarak destekliyor
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium">Desteklenmiyor</p>
                      <p className="text-sm text-muted-foreground">
                        Lütfen modern bir tarayıcı kullanın (Chrome, Firefox, Safari, Edge)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Medya İzinleri
              </CardTitle>
              <CardDescription>Kamera ve mikrofon erişim durumu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {hasMediaPermissions === null ? (
                  <>
                    <Activity className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm">Kontrol ediliyor...</p>
                  </>
                ) : hasMediaPermissions ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium">İzin verildi</p>
                      <p className="text-sm text-muted-foreground">
                        Kamera ve mikrofon erişimi sağlandı
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium">İzin reddedildi</p>
                      <p className="text-sm text-muted-foreground">
                        Tarayıcı ayarlarından izinleri kontrol edin
                      </p>
                    </div>
                  </>
                )}
              </div>

              {hasMediaPermissions && devices.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-medium">Tespit Edilen Cihazlar:</p>
                  <div className="grid gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mikrofonlar</p>
                      {devices
                        .filter((d) => d.kind === 'audioinput')
                        .map((device, idx) => (
                          <Badge key={device.deviceId} variant="outline" className="mr-2 mb-2">
                            {device.label || `Mikrofon ${idx + 1}`}
                          </Badge>
                        ))}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Kameralar</p>
                      {devices
                        .filter((d) => d.kind === 'videoinput')
                        .map((device, idx) => (
                          <Badge key={device.deviceId} variant="outline" className="mr-2 mb-2">
                            {device.label || `Kamera ${idx + 1}`}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STUN/TURN Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                ICE Bağlantı Testi
              </CardTitle>
              <CardDescription>STUN sunucuları ve ICE candidate toplama</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {stunTestResult === 'idle' && (
                    <p className="text-sm text-muted-foreground">Test başlatılmadı</p>
                  )}
                  {stunTestResult === 'testing' && (
                    <>
                      <Activity className="h-5 w-5 animate-spin text-primary" />
                      <p className="text-sm">ICE candidates toplanıyor...</p>
                    </>
                  )}
                  {stunTestResult === 'success' && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <p className="text-sm font-medium">Test başarılı</p>
                    </>
                  )}
                  {stunTestResult === 'failed' && (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <p className="text-sm font-medium">Test başarısız</p>
                    </>
                  )}
                </div>
                <Button
                  onClick={testICEConnectivity}
                  disabled={isTestingConnection || !isWebRTCSupported}
                >
                  {isTestingConnection ? 'Test Ediliyor...' : 'Testi Başlat'}
                </Button>
              </div>

              {iceCandidates.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Toplanan ICE Candidates ({iceCandidates.length})
                    </p>
                    <div className="flex gap-2">
                      {iceCandidates.some((c) => c.type === 'host') && (
                        <Badge variant="outline">Host</Badge>
                      )}
                      {iceCandidates.some((c) => c.type === 'srflx') && (
                        <Badge variant="success">STUN (srflx)</Badge>
                      )}
                      {iceCandidates.some((c) => c.type === 'relay') && (
                        <Badge variant="default">TURN (relay)</Badge>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="h-64 rounded-md border">
                    <div className="p-4 space-y-2">
                      {iceCandidates.map((candidate, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Type:</span>{' '}
                              <Badge variant="outline" className="text-xs">
                                {candidate.type}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Protocol:</span>{' '}
                              <span className="font-mono">{candidate.protocol}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Address:</span>{' '}
                              <span className="font-mono">
                                {candidate.address}:{candidate.port}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Priority:</span>{' '}
                              <span className="font-mono">{candidate.priority}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Not:</strong> Host candidates yerel IP'nizi, srflx candidates
                  (STUN) genel IP'nizi, relay candidates (TURN) ise TURN sunucunuzdan gelen
                  bağlantıyı gösterir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* STUN Servers Info */}
          <Card>
            <CardHeader>
              <CardTitle>Yapılandırılmış STUN/TURN Sunucuları</CardTitle>
              <CardDescription>Aktif ICE server listesi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DEFAULT_ICE_SERVERS.map((server, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="space-y-1">
                      <p className="font-mono text-sm">{server.urls}</p>
                      {server.username && (
                        <div className="text-xs text-muted-foreground">
                          Username: {server.username}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
