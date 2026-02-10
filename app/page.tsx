'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Video, Users, MessageSquare, Activity, ArrowRight, AlertCircle } from 'lucide-react'
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
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute -right-1 -top-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-primary"></span>
              </div>
              <div className="rounded-3xl bg-primary/10 p-5 shadow-inner">
                <Video className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Kesintisiz <span className="text-primary">Video</span> Deneyimi
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg lg:text-xl">
            Kuruluma, üyeliğe veya indirmeye gerek yok.
            Linkini paylaş ve saniyeler içinde HD kalitesinde görüşmeye başla.
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
        <div className="mx-auto max-w-4xl px-2">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create Room Action */}
            <Card className="flex flex-col overflow-hidden border-2 border-primary/10 transition-all hover:border-primary/30 hover:shadow-xl">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Video className="h-5 w-5" />
                </div>
                <CardTitle>Yeni Görüşme</CardTitle>
                <CardDescription>
                  Anında yeni bir güvenli oda oluşturun.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-6 flex-1 space-y-4">
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 shrink-0" />
                    <span>Oda ID'si otomatik olarak oluşturulacak ve şifreli olacak.</span>
                  </div>
                </div>
                <Button
                  onClick={handleCreateRoom}
                  size="lg"
                  className="w-full shadow-md transition-transform active:scale-[0.98]"
                >
                  Görüşme Başlat
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Join Room Action */}
            <Card className="flex flex-col overflow-hidden border-2 border-transparent transition-all hover:border-border/50 hover:shadow-xl">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle>Odaya Katıl</CardTitle>
                <CardDescription>
                  Davet edildiğiniz odaya giriş yapın.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-6 flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Oda ID
                    </Label>
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
                      className="h-12 border-muted bg-muted/20 text-center font-mono text-lg tracking-widest focus-visible:ring-primary"
                    />
                    {error && (
                      <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleJoinRoom}
                  variant="outline"
                  size="lg"
                  className="w-full transition-transform active:scale-[0.98]"
                  disabled={!roomId}
                >
                  Katıl
                </Button>
              </CardContent>
            </Card>
          </div>

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
