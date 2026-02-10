'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LogIn, Loader2, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'

export function AuthModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [localUser, setLocalUser] = useState<{ id: string, name: string } | null>(null)

    useEffect(() => {
        // Sayfa yüklendiğinde local storage'dan kullanıcıyı al
        const checkLocalUser = () => {
            const savedUser = localStorage.getItem('webrtc_user')
            if (savedUser) {
                setLocalUser(JSON.parse(savedUser))
            } else {
                setLocalUser(null)
            }
        }

        const openModal = () => setIsOpen(true)

        checkLocalUser()

        // Diğer sekmelerden veya bileşenlerden gelen değişiklikleri dinle
        window.addEventListener('storage', checkLocalUser)
        window.addEventListener('local-auth-changed', checkLocalUser)
        window.addEventListener('open-auth-modal', openModal)

        return () => {
            window.removeEventListener('storage', checkLocalUser)
            window.removeEventListener('local-auth-changed', checkLocalUser)
            window.removeEventListener('open-auth-modal', openModal)
        }
    }, [])

    const handleQuickLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim()) return
        setIsLoading(true)

        // Küçük bir gecikme ekleyelim ki işlem yapılıyor hissi versin
        await new Promise(resolve => setTimeout(resolve, 600))

        const newUser = {
            id: `user_${Math.random().toString(36).substring(2, 11)}`,
            name: username.trim()
        }

        localStorage.setItem('webrtc_user', JSON.stringify(newUser))
        window.dispatchEvent(new Event('local-auth-changed'))

        toast.success(`Hoş geldin, ${newUser.name}!`)
        setIsOpen(false)
        setIsLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('webrtc_user')
        window.dispatchEvent(new Event('local-auth-changed'))
        toast.success('Kimlik bilgileri temizlendi')
    }

    if (localUser) {
        return (
            <div className="flex items-center gap-4 animate-in fade-in duration-500">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <User className="h-5 w-5" />
                </div>
                <div className="hidden flex-col sm:flex">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Cihaz Kimliği</span>
                    <span className="text-sm font-bold truncate max-w-[150px]">{localUser.name}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Kimliği Sil"
                    className="hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                    <LogIn className="h-4 w-4" />
                    Kimlik Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Görüşmeye Başla</DialogTitle>
                    <DialogDescription>
                        Sunucu tarafında hiç kayıt tutmuyoruz. Sadece bu cihazda görünecek bir isim belirleyin.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleQuickLogin} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Görüşmede görünecek isminiz</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="username"
                                type="text"
                                placeholder="Örn: Mehmet Can"
                                className="pl-10 h-12"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg" disabled={isLoading || !username.trim()}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <LogIn className="mr-2 h-5 w-5" />
                        )}
                        Kaydet ve Devam Et
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
                        Üyelik yok, mail yok, şifre yok. <br />
                        Sadece isim gir ve bağlan.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    )
}
