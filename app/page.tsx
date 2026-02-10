'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Video, Users, MessageSquare, Activity, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react'
import { generateRoomId, parseRoomId, isValidRoomId } from '@/lib/utils/room'
import { AuthModal } from '@/components/auth-modal'

export default function LandingPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [showActions, setShowActions] = useState(false)

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
      {/* Navbar with Auth */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">WebRTC <span className="text-primary">Meet</span></span>
          </div>
          <AuthModal />
        </div>
      </nav>

      <div className="container mx-auto px-4">
        {/* Full-height Hero Section */}
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center py-12 text-center lg:py-20">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative inline-block">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-xl"></div>
              <div className="relative rounded-3xl bg-primary/10 p-6 shadow-2xl outline outline-1 outline-primary/20">
                <Video className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>

          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <h1 className="text-5xl font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl">
              Geleceğin <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Görüntülü</span> İletişimi
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty sm:text-xl lg:text-2xl">
              Hızlı, güvenli ve tamamen ücretsiz. Hiçbir kurulum gerektirmeden, saniyeler içinde sevdiklerinize bağlanın.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            {!showActions ? (
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:shadow-primary/25 active:scale-95"
                onClick={() => {
                  setShowActions(true)
                  setTimeout(() => {
                    document.getElementById('action-section')?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }}
              >
                Görüşmeye Başla
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            ) : (
              <div className="flex h-14 items-center gap-2 text-primary font-medium">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <span className="uppercase tracking-widest text-xs">Aşağıdan Oda Seçin</span>
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-75" />
              </div>
            )}

            <div className="flex items-center gap-6 mt-8 grayscale opacity-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-medium">E2E Şifreli</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <span className="text-sm font-medium">Ultra Düşük Gecikme</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid - More subtle */}
        <div className="mb-24 grid gap-6 sm:gap-8 md:grid-cols-3">
          {[
            { icon: Video, title: "HD Kalite", desc: "Kristal netliğinde 4K'ya kadar video desteği." },
            { icon: MessageSquare, title: "Anlık Sohbet", desc: "Görüşme sırasında dosya ve mesaj paylaşımı." },
            { icon: Activity, title: "Canlı Metrikler", desc: "Bağlantı kalitesini anlık takip edin." }
          ].map((feature, i) => (
            <div key={i} className="group rounded-3xl border bg-card/50 p-8 transition-all hover:bg-card">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Section - Hidden by default */}
        {showActions && (
          <div id="action-section" className="mx-auto max-w-4xl px-2 pb-24 animate-in fade-in slide-in-from-top-12 duration-700">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold">Nasıl Bağlanmak İstersiniz?</h2>
              <p className="text-muted-foreground mt-2">Yeni bir oda kurun veya arkadaşınızın odasına katılın.</p>
            </div>
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
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t py-8 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-6">
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
          <div className="hidden h-4 w-px bg-border sm:block" />
          <p>© 2024 WebRTC Meet. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
}
