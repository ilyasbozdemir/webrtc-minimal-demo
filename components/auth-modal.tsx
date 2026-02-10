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
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                toast.success('Giriş başarılı!')
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0], // Default name from email
                        }
                    }
                })
                if (error) throw error
                toast.success('Kayıt başarılı! Şimdi giriş yapabilirsiniz.')
                setIsLogin(true)
            }
            setIsOpen(false)
        } catch (error: any) {
            toast.error(error.message || 'Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Çıkış yapıldı')
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                </div>
                <div className="hidden flex-col sm:flex">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Giriş Yapıldı</span>
                    <span className="text-sm font-semibold truncate max-w-[150px]">{user.email}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Çıkış Yap">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{isLogin ? 'Hesabınıza Giriş Yapın' : 'Yeni Hesap Oluştur'}</DialogTitle>
                    <DialogDescription>
                        {isLogin
                            ? 'Görüşme geçmişinizi kaydetmek ve profilinizi kişiselleştirmek için giriş yapın.'
                            : 'Hızla hesap oluşturun ve görüşmelere hemen katılın.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@email.com"
                                className="pl-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Şifre</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isLogin ? (
                            <LogIn className="mr-2 h-4 w-4" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                    </Button>
                    <div className="text-center text-sm">
                        <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Henüz hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
