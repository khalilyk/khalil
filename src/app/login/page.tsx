'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const OWNER_EMAIL = 'khalilykhouri@gmail.com'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true)
    setError('')
    setInfo('')
    try {
      if (!window.PublicKeyCredential) {
        setError('Passkeys not supported in this browser.')
        setPasskeyLoading(false)
        return
      }
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // @ts-ignore — experimental API
      const { error } = await supabase.auth.signInWithPasskey()
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const msg: string = err?.message ?? 'Passkey sign-in failed.'
      // Passkeys are still gated server-side in Supabase — guide to password instead
      if (/disabled|not enabled|experimental/i.test(msg)) {
        setInfo('Passkey sign-in isn’t enabled yet — use your password below.')
      } else {
        setError(msg)
      }
      setPasskeyLoading(false)
    }
  }

  async function handleForgotPassword() {
    setResetting(true)
    setError('')
    setInfo('')
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(OWNER_EMAIL, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) setError(error.message)
    else setInfo(`Reset link sent to ${OWNER_EMAIL}.`)
    setResetting(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary flex-col justify-between p-12">
        {/* Grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative z-10">
          <span className="text-foreground font-bold tracking-tight text-lg">Khalil</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-5xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              Building<br />the future<br />you want.
            </p>
            <p className="text-foreground/60 text-base leading-relaxed max-w-xs">
              Money, body, calendar, and a personal assistant — all working toward where you&apos;re headed next.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            {['Money', 'Body', 'Work', 'Calendar', 'AI'].map(tag => (
              <span key={tag} className="text-xs text-foreground/70 border border-foreground/20 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-foreground/50 text-xs">Private. Yours only.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <span className="font-bold tracking-tight text-lg">Khalil</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to keep building forward</p>
          </div>

          {/* Passkey button */}
          <button
            onClick={handlePasskey}
            disabled={passkeyLoading}
            className={cn(
              'w-full flex items-center justify-center gap-3 rounded-full border border-border px-4 py-3.5 text-sm font-medium transition-all',
              'hover:bg-muted hover:border-primary active:scale-[0.98]',
              passkeyLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {passkeyLoading
              ? <Loader2 size={18} className="animate-spin" />
              : <Fingerprint size={18} />
            }
            Continue with Passkey
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">or sign in with password</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {resetting ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>
              <Input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required autoFocus
                className="h-11 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-foreground bg-primary/15 rounded-lg px-3 py-2">{info}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-full gap-2 group font-semibold">
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <>Sign in <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
