'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Mic, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { MediaDeviceManager } from '@/lib/webrtc/media-devices'

interface PermissionRequestProps {
  onPermissionsGranted: () => void
  onPermissionsDenied: () => void
}

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied'

export function PermissionRequest({ onPermissionsGranted, onPermissionsDenied }: PermissionRequestProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('idle')
  const [error, setError] = useState<string>('')

  const requestPermissions = async () => {
    setPermissionState('requesting')
    setError('')

    try {
      // Check browser support first
      if (!MediaDeviceManager.isWebRTCSupported()) {
        throw new Error('Tarayıcınız WebRTC desteklemiyor. Lütfen modern bir tarayıcı kullanın.')
      }

      // Request permissions
      const granted = await MediaDeviceManager.requestPermissions()

      if (granted) {
        setPermissionState('granted')
        setTimeout(() => {
          onPermissionsGranted()
        }, 800)
      } else {
        throw new Error('İzin verilmedi')
      }
    } catch (err: any) {
      setPermissionState('denied')
      
      let errorMessage = 'Kamera ve mikrofon erişimi reddedildi.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'İzin talebini reddettiniz. Tarayıcı ayarlarınızdan izinleri değiştirebilirsiniz.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Kamera veya mikrofon bulunamadı. Cihazlarınızın bağlı olduğundan emin olun.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Cihazlarınıza erişilemiyor. Başka bir uygulama kullanıyor olabilir.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      onPermissionsDenied()
    }
  }

  const getStateIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle2 className="h-16 w-16 text-green-500" />
      case 'denied':
        return <AlertCircle className="h-16 w-16 text-destructive" />
      case 'requesting':
        return (
          <div className="relative">
            <div className="h-16 w-16 animate-pulse rounded-full bg-primary/20" />
            <ShieldCheck className="absolute inset-0 m-auto h-10 w-10 text-primary" />
          </div>
        )
      default:
        return <ShieldCheck className="h-16 w-16 text-primary" />
    }
  }

  const getStateMessage = () => {
    switch (permissionState) {
      case 'granted':
        return {
          title: 'İzinler verildi!',
          description: 'Cihaz kurulumuna yönlendiriliyorsunuz...',
        }
      case 'denied':
        return {
          title: 'İzin verilmedi',
          description: 'Görüşme yapabilmek için kamera ve mikrofon izinlerini vermelisiniz.',
        }
      case 'requesting':
        return {
          title: 'İzin isteniyor...',
          description: 'Tarayıcınızda çıkan izin talebini kabul edin.',
        }
      default:
        return {
          title: 'Medya izinleri gerekli',
          description: 'Görüşme yapabilmek için kamera ve mikrofon erişimine izin vermelisiniz.',
        }
    }
  }

  const message = getStateMessage()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">{getStateIcon()}</div>
          <CardTitle className="text-2xl">{message.title}</CardTitle>
          <CardDescription className="text-base">{message.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="rounded-full bg-background p-2">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Kamera</p>
                <p className="text-xs text-muted-foreground">Video görüşme için gerekli</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="rounded-full bg-background p-2">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Mikrofon</p>
                <p className="text-xs text-muted-foreground">Sesli iletişim için gerekli</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          {permissionState !== 'granted' && (
            <Button
              onClick={requestPermissions}
              size="lg"
              className="w-full"
              disabled={permissionState === 'requesting'}
            >
              {permissionState === 'requesting' ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                  İzin bekleniyor...
                </>
              ) : permissionState === 'denied' ? (
                'Tekrar dene'
              ) : (
                'İzinleri ver'
              )}
            </Button>
          )}

          {/* Help Text */}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Not:</p>
            <p>
              İzin vermediğinizde görüşme yapamazsınız. Eğer yanlışlıkla reddettiyseniz, tarayıcınızın
              adres çubuğundaki kilit simgesinden izinleri değiştirebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
