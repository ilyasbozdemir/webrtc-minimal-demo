'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, RotateCcw, Info } from 'lucide-react'
import { VideoQuality } from '@/lib/webrtc/config'

interface Settings {
  signalingUrl: string
  stunServer: string
  turnServer: string
  turnUsername: string
  turnCredential: string
  defaultVideoQuality: VideoQuality
  autoStartVideo: boolean
  autoStartAudio: boolean
}

const DEFAULT_SETTINGS: Settings = {
  signalingUrl: '',
  stunServer: 'stun:stun.l.google.com:19302',
  turnServer: '',
  turnUsername: '',
  turnCredential: '',
  defaultVideoQuality: '720p',
  autoStartVideo: true,
  autoStartAudio: true,
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('webrtc-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('webrtc-settings', JSON.stringify(settings))
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('webrtc-settings')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
          <h1 className="text-3xl font-bold">Ayarlar</h1>
          <p className="mt-2 text-muted-foreground">
            WebRTC bağlantı ve medya ayarlarını yapılandırın
          </p>
        </div>

        <div className="space-y-6">
          {/* Signaling Server */}
          <Card>
            <CardHeader>
              <CardTitle>Signaling Sunucusu</CardTitle>
              <CardDescription>
                WebRTC signaling için WebSocket sunucu adresi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signaling-url">WebSocket URL</Label>
                <Input
                  id="signaling-url"
                  type="url"
                  placeholder="wss://your-signaling-server.com"
                  value={settings.signalingUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, signalingUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Örnek: wss://signaling.example.com:8080
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Signaling sunucusu, peer'ler arasında SDP offer/answer ve ICE
                  candidate'lerini iletmek için gereklidir. Demo modunda bu alan
                  opsiyoneldir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* ICE Servers */}
          <Card>
            <CardHeader>
              <CardTitle>ICE Sunucuları (STUN/TURN)</CardTitle>
              <CardDescription>
                NAT traversal için STUN ve TURN sunucu yapılandırması
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stun-server">STUN Sunucu</Label>
                <Input
                  id="stun-server"
                  placeholder="stun:stun.l.google.com:19302"
                  value={settings.stunServer}
                  onChange={(e) =>
                    setSettings({ ...settings, stunServer: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Varsayılan: Google STUN sunucusu (ücretsiz)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turn-server">TURN Sunucu (Opsiyonel)</Label>
                <Input
                  id="turn-server"
                  placeholder="turn:turn.example.com:3478"
                  value={settings.turnServer}
                  onChange={(e) =>
                    setSettings({ ...settings, turnServer: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="turn-username">TURN Kullanıcı Adı</Label>
                  <Input
                    id="turn-username"
                    value={settings.turnUsername}
                    onChange={(e) =>
                      setSettings({ ...settings, turnUsername: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turn-credential">TURN Şifre</Label>
                  <Input
                    id="turn-credential"
                    type="password"
                    value={settings.turnCredential}
                    onChange={(e) =>
                      setSettings({ ...settings, turnCredential: e.target.value })
                    }
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  TURN sunucusu, katı firewall veya NAT arkasındaki kullanıcılar için
                  gerekebilir. Ücretsiz STUN çoğu durumda yeterlidir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Media Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Medya Ayarları</CardTitle>
              <CardDescription>
                Varsayılan kamera ve mikrofon davranışı
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="video-quality">Varsayılan Video Kalitesi</Label>
                <Select
                  value={settings.defaultVideoQuality}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      defaultVideoQuality: value as VideoQuality,
                    })
                  }
                >
                  <SelectTrigger id="video-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p (Düşük bant genişliği)</SelectItem>
                    <SelectItem value="720p">720p (Önerilen)</SelectItem>
                    <SelectItem value="1080p">1080p (Yüksek kalite)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-video">Kamerayı otomatik başlat</Label>
                  <p className="text-sm text-muted-foreground">
                    Görüşmeye katılırken kamera otomatik açılsın
                  </p>
                </div>
                <Switch
                  id="auto-video"
                  checked={settings.autoStartVideo}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoStartVideo: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-audio">Mikrofonu otomatik başlat</Label>
                  <p className="text-sm text-muted-foreground">
                    Görüşmeye katılırken mikrofon otomatik açılsın
                  </p>
                </div>
                <Switch
                  id="auto-audio"
                  checked={settings.autoStartAudio}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoStartAudio: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {isSaved ? 'Kaydedildi!' : 'Kaydet'}
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Sıfırla
            </Button>
          </div>

          {isSaved && (
            <Alert>
              <AlertDescription>
                Ayarlar başarıyla kaydedildi. Yeni ayarlar bir sonraki görüşmede
                kullanılacaktır.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
