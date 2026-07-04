'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2 } from 'lucide-react'

const OWNER_EMAIL = 'khalilykhouri@gmail.com'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
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
    <div className="h-[100dvh] lg:h-auto lg:min-h-screen flex flex-col lg:flex-row overflow-hidden lg:overflow-visible">
      {/* Brand panel — fills the space above the form on mobile, left half on desktop */}
      <div className="relative overflow-hidden bg-primary flex-1 lg:flex-none lg:w-1/2 lg:min-h-screen flex flex-col px-6 py-8 lg:p-12">
        {/* Grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

        {/* KHALIL — heavy, condensed, packed to fill the width */}
        <svg viewBox="0 0 1000 260" preserveAspectRatio="none" aria-label="Khalil"
          className="relative z-10 block w-full h-28 sm:h-36 lg:h-32 text-white">
          <text x="500" y="212" textAnchor="middle" textLength="1000" lengthAdjust="spacingAndGlyphs"
            fill="currentColor" style={{ fontSize: '260px', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'inherit' }}>
            KHALIL
          </text>
        </svg>

        {/* Content — vertically centred in the remaining orange space */}
        <div className="relative z-10 flex-1 flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <p className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.05]">
              Building<br />the future<br />you want.
            </p>
            <p className="text-white/70 text-sm lg:text-base leading-relaxed max-w-xs">
              Money, body, work, and calendar — with weekly, monthly, and annual reviews to keep you on track.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {['Money', 'Body', 'Work', 'Calendar', 'Review'].map(tag => (
              <span key={tag} className="text-xs text-white/80 border border-white/30 rounded-full px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <p className="text-white/60 text-xs">Private. Yours only.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-none lg:flex-1 flex items-center justify-center px-6 py-8 lg:p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to keep building forward</p>
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
