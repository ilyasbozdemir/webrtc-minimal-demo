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

  const handleCreateRoom = () => {
    const savedUser = localStorage.getItem('webrtc_user')
    if (!savedUser) {
      setError('Görüşmeye başlamak için önce bir isim belirlemelisiniz.')
      window.dispatchEvent(new Event('open-auth-modal'))
      return
    }
    const newRoomId = generateRoomId()
    router.push(`/setup?roomId=${newRoomId}&create=true`)
  }

  const handleJoinRoom = () => {
    const savedUser = localStorage.getItem('webrtc_user')
    if (!savedUser) {
      setError('Odaya katılmak için önce bir isim belirlemelisiniz.')
      window.dispatchEvent(new Event('open-auth-modal'))
      return
    }

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
        {/* Compact Hero Section */}
        <div className="flex flex-col items-center justify-center pt-16 pb-12 text-center lg:pt-24 lg:pb-16">
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative inline-block">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-xl"></div>
              <div className="relative rounded-2xl bg-primary/10 p-4 shadow-xl outline outline-1 outline-primary/20">
                <Video className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>

          <div className="max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Geleceğin <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Görüntülü</span> İletişimi
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg lg:text-xl">
              Hızlı, güvenli ve tamamen ücretsiz. Saniyeler içinde sevdiklerinize bağlanın.
            </p>
          </div>
        </div>

        {/* Action Section - Visible Directly */}
        <div className="mx-auto max-w-5xl px-2 pb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Create Room Action */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-primary/50 to-blue-500/50 opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
              <Card className="relative flex flex-col h-full overflow-hidden rounded-[2.5rem] border-primary/10 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20">
                  <Video className="h-24 w-24 rotate-12" />
                </div>
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <Video className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Yeni Görüşme</CardTitle>
                  <CardDescription className="text-base">
                    Saniyeler içinde özel bir oda oluşturun ve linki paylaşın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col p-6 pt-0">
                  <ul className="mb-8 space-y-3 flex-1">
                    {['Otomatik oda ID oluşturma', 'Uçtan uca şifreli veri', 'Katılımcı sınırı yok'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleCreateRoom}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95"
                  >
                    Oda Oluştur
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Join Room Action */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-muted to-muted opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
              <Card className="relative flex flex-col h-full overflow-hidden rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20">
                  <Users className="h-24 w-24 -rotate-12" />
                </div>
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Odaya Katıl</CardTitle>
                  <CardDescription className="text-base">
                    Size gönderilen Oda ID'sini kullanarak bağlanın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col p-6 pt-0">
                  <div className="mb-8 flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomId" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Oda Kodu</Label>
                      <Input
                        id="roomId"
                        placeholder="Örn: ABCD-1234"
                        value={roomId}
                        onChange={(e) => {
                          setRoomId(e.target.value.toUpperCase())
                          setError('')
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                        className="h-14 rounded-xl border-dashed border-2 bg-muted/20 text-center font-mono text-xl tracking-[0.3em] focus-visible:ring-primary focus-visible:border-primary"
                      />
                      {error && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {error}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleJoinRoom}
                    variant="outline"
                    size="lg"
                    className="w-full h-14 rounded-2xl text-lg font-bold border-2 transition-all active:scale-95"
                    disabled={!roomId}
                  >
                    Katıl
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Row */}
        <div className="mb-24 grid gap-6 sm:gap-8 md:grid-cols-3 opacity-90">
          {[
            { icon: Video, title: "HD Kalite", desc: "Kristal netliğinde video desteği." },
            { icon: MessageSquare, title: "Anlık Sohbet", desc: "Görüşme sırasında mesajlaşın." },
            { icon: Activity, title: "Canlı Metrikler", desc: "Bağlantıyı anlık takip edin." }
          ].map((feature, i) => (
            <div key={i} className="group flex items-start gap-4 rounded-3xl border bg-card/30 p-6 backdrop-blur-sm transition-all hover:bg-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-8 pb-20 opacity-40 grayscale">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">E2E Şifreli</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Ultra Düşük Gecikme</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 border-t py-12 text-sm text-muted-foreground sm:flex-row sm:justify-between px-4">
          <div className="flex gap-6">
            <button onClick={() => router.push('/diagnostics')} className="hover:text-foreground transition-colors">Tanılama</button>
            <button onClick={() => router.push('/settings')} className="hover:text-foreground transition-colors">Ayarlar</button>
          </div>
          <p>© 2024 WebRTC Meet. Güvenli ve Hızlı.</p>
        </div>
      </div>
    </div>
  )
}
