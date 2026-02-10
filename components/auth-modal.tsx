'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LogIn, UserPlus, Mail, Lock, Loader2, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'

export function AuthModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleQuickLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username) return
        setIsLoading(true)

        try {
            // Anonim giriş yap ve kullanıcı bilgilerini güncelle
            const { data, error } = await supabase.auth.signInAnonymously({
                options: {
                    data: {
                        full_name: username,
                        display_name: username
                    }
                }
            })

            if (error) throw error

            toast.success(`Hoş geldin, ${username}!`)
            setIsOpen(false)
        } catch (error: any) {
            toast.error(error.message || 'Giriş yapılamadı')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Görüşmeden ayrıldınız')
    }

    if (user) {
        const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Kullanıcı'
        return (
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <User className="h-5 w-5" />
                </div>
                <div className="hidden flex-col sm:flex">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Aktif Oturum</span>
                    <span className="text-sm font-bold truncate max-w-[150px]">{displayName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Çıkış Yap" className="hover:bg-destructive/10 hover:text-destructive">
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
                    Giriş Yap
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Görüşmeye Katıl</DialogTitle>
                    <DialogDescription>
                        Mail veya şifre ile uğraşmanıza gerek yok. Sadece bir isim girerek anında bağlanın.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleQuickLogin} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Adınız veya Takma Adınız</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="username"
                                type="text"
                                placeholder="Örn: Ahmet Yılmaz"
                                className="pl-10 h-12"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg" disabled={isLoading || !username}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <LogIn className="mr-2 h-5 w-5" />
                        )}
                        Hele Bir Gir Bakalım
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                        Anonim oturum açılır, mail gönderilmez.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    )
}
