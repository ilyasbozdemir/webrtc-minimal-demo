'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Video, Users, MessageSquare, Activity } from 'lucide-react'
import { generateRoomId, parseRoomId, isValidRoomId } from '@/lib/utils/room'

export default function LandingPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId()
    router.push(`/setup?roomId=${newRoomId}&create=true`)
  }

  const handleJoinRoom = () => {
    const parsedRoomId = parseRoomId(roomId)
    
    if (!isValidRoomId(parsedRoomId)) {
      setError('Geçersiz oda ID formatı. Lütfen 6-12 karakter uzunluğunda alfanumerik bir ID girin.')
      return
    }

    setError('')
    router.push(`/setup?roomId=${parsedRoomId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-12 text-center lg:mb-16">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-3 sm:p-4">
              <Video className="h-10 w-10 text-primary sm:h-12 sm:w-12" />
            </div>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-balance sm:mb-4 sm:text-4xl lg:text-5xl">
            Modern Video Görüşme Platformu
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
            WebRTC teknolojisi ile güvenli, yüksek kaliteli ve düşük gecikmeli 1'e 1 video görüşmeler yapın.
            Hiçbir kurulum gerektirmez, doğrudan tarayıcınızdan bağlanın.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:gap-6 md:grid-cols-3 lg:mb-16">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                <Video className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              </div>
              <CardTitle className="text-base sm:text-lg">HD Video Kalitesi</CardTitle>
              <CardDescription className="text-sm">
                720p ve 1080p destekli yüksek kaliteli video görüşmeler
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                <MessageSquare className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              </div>
              <CardTitle className="text-base sm:text-lg">Anlık Mesajlaşma</CardTitle>
              <CardDescription className="text-sm">
                WebRTC DataChannel ile gerçek zamanlı text chat
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                <Activity className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              </div>
              <CardTitle className="text-base sm:text-lg">Bağlantı Kalitesi</CardTitle>
              <CardDescription className="text-sm">
                Bitrate, ping ve packet loss gibi detaylı metrikler
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Görüşme Başlat
              </CardTitle>
              <CardDescription className="text-sm">
                Yeni bir oda oluşturun veya mevcut bir odaya katılın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Room */}
              <div>
                <Button 
                  onClick={handleCreateRoom} 
                  size="lg" 
                  className="w-full"
                >
                  <Video className="mr-2 h-5 w-5" />
                  Yeni Oda Oluştur
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">
                  Benzersiz bir oda ID oluşturun ve arkadaşınızla paylaşın
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    veya
                  </span>
                </div>
              </div>

              {/* Join Room */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId" className="text-sm">Oda ID</Label>
                  <Input
                    id="roomId"
                    placeholder="Örn: ABCD-1234"
                    value={roomId}
                    onChange={(e) => {
                      setRoomId(e.target.value.toUpperCase())
                      setError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinRoom()
                      }
                    }}
                    className="text-base sm:text-sm"
                  />
                  {error && (
                    <p className="text-xs text-destructive sm:text-sm">{error}</p>
                  )}
                </div>
                <Button 
                  onClick={handleJoinRoom} 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  disabled={!roomId}
                >
                  Odaya Katıl
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="mt-6 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:mt-8 sm:flex-row sm:justify-center sm:gap-6">
            <button
              onClick={() => router.push('/diagnostics')}
              className="transition-colors hover:text-foreground"
            >
              Bağlantı Tanılama
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="transition-colors hover:text-foreground"
            >
              Ayarlar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
