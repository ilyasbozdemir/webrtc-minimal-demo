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
  const [activeTab, setActiveTab] = useState<'none' | 'create' | 'join'>('none')

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
        {/* Full-height Hero Section */}
        <div className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center py-12 text-center lg:py-20">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative inline-block">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-xl"></div>
              <div className="relative rounded-3xl bg-primary/10 p-6 shadow-2xl outline outline-1 outline-primary/20">
                <Video className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>

          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <h1 className="text-5xl font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl leading-tight">
              Geleceğin <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Görüntülü</span> İletişimi
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty sm:text-xl lg:text-2xl">
              Hızlı, güvenli ve tamamen ücretsiz. Saniyeler içinde sevdiklerinize bağlanın.
            </p>
          </div>

          {/* Initial Choice Flow */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000">
            <Button
              size="lg"
              variant={activeTab === 'create' ? 'default' : 'secondary'}
              className="h-16 px-10 text-xl font-bold rounded-2.5xl shadow-2xl transition-all hover:scale-105 active:scale-95"
              onClick={() => {
                setActiveTab('create')
                setTimeout(() => document.getElementById('action-card')?.scrollIntoView({ behavior: 'smooth' }), 100)
              }}
            >
              <Video className="mr-3 h-7 w-7" />
              Görüşme Başlat
            </Button>
            <Button
              size="lg"
              variant={activeTab === 'join' ? 'default' : 'outline'}
              className="h-16 px-10 text-xl font-bold rounded-2.5xl border-2 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
              onClick={() => {
                setActiveTab('join')
                setTimeout(() => {
                  document.getElementById('action-card')?.scrollIntoView({ behavior: 'smooth' })
                  document.getElementById('roomId')?.focus()
                }, 100)
              }}
            >
              <Users className="mr-3 h-7 w-7" />
              Odaya Katıl
            </Button>
          </div>

          {/* Action Card Section (Revealed on choice) */}
          {activeTab !== 'none' && (
            <div id="action-card" className="mt-16 w-full max-w-2xl px-2 animate-in fade-in zoom-in slide-in-from-top-8 duration-500">
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-r from-primary to-blue-600 opacity-30 blur-xl transition duration-500"></div>
                <Card className="relative overflow-hidden rounded-[2.5rem] border-primary/20 bg-card/80 backdrop-blur-2xl shadow-2xl">
                  {activeTab === 'create' ? (
                    <>
                      <CardHeader className="pb-4 text-left">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                          <Video className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Yeni Görüşme</CardTitle>
                        <CardDescription className="text-lg">
                          Özel oda ID'si oluşturulacak ve link paylaşımına hazır hale gelecek.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col p-8 pt-0">
                        <ul className="mb-8 space-y-4 text-left">
                          {['Uçtan uca şifreli veri aktarımı', 'Yüksek kaliteli ses ve video', 'Katılımcı sınırı bulunmuyor'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-base text-muted-foreground font-medium">
                              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={handleCreateRoom}
                          size="lg"
                          className="h-16 w-full rounded-2xl text-xl font-bold shadow-xl transition-all active:scale-95 bg-primary hover:bg-primary/90"
                        >
                          Odayı Oluştur ve Başlat
                          <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <CardHeader className="pb-4 text-left">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                          <Users className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Odaya Katıl</CardTitle>
                        <CardDescription className="text-lg">
                          Bağlanmak istediğiniz görüşmenin oda kodunu girin.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col p-8 pt-0 text-left">
                        <div className="mb-8 space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="roomId" className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Oda Kodu</Label>
                            <Input
                              id="roomId"
                              placeholder="Örn: XBRK-RN7U"
                              value={roomId}
                              onChange={(e) => {
                                setRoomId(e.target.value.toUpperCase())
                                setError('')
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                              className="h-20 rounded-2xl border-2 border-primary/20 bg-muted/20 text-center font-mono text-3xl tracking-[0.5em] focus-visible:ring-primary focus-visible:border-primary transition-all shadow-inner"
                            />
                            {error && (
                              <p className="flex items-center gap-2 text-sm font-bold text-destructive animate-in fade-in slide-in-from-top-1 px-1 mt-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                {error}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={handleJoinRoom}
                          size="lg"
                          className="h-16 w-full rounded-2xl text-xl font-bold shadow-xl transition-all active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={!roomId}
                        >
                          Giriş Yap
                        </Button>
                      </CardContent>
                    </>
                  )}
                </Card>
              </div>
            </div>
          )}

          <div className="flex items-center gap-8 mt-16 grayscale opacity-30 animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">E2E Şifreli</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Low Latency</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-6 border-t border-primary/10 py-16 text-sm text-muted-foreground sm:flex-row sm:justify-between px-4">
          <div className="flex gap-8 font-medium">
            <button onClick={() => router.push('/diagnostics')} className="hover:text-primary transition-colors">Tanılama</button>
            <button onClick={() => router.push('/settings')} className="hover:text-primary transition-colors">Ayarlar</button>
          </div>
          <p>© 2024 WebRTC Meet. Güvenli İletişim.</p>
        </div>
      </div>
    </div>
  )
}
