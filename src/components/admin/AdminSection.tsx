'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check, User, KeyRound, LogOut } from 'lucide-react'

type Profile = {
  display_name: string | null
  full_name: string | null
  phone: string | null
  contact_email: string | null
  emergency_contact: string | null
  timezone: string
  currency: string
}

export default function AdminSection({ userId, email, profile }: {
  userId: string; email: string; profile: Profile
}) {
  const router = useRouter()

  // Contact form
  const [form, setForm] = useState(profile)
  const [savingContact, setSavingContact] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  // Login form
  const [password, setPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  async function saveContact() {
    setSavingContact(true)
    setContactSaved(false)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('profiles').update({
      display_name: form.display_name,
      full_name: form.full_name,
      phone: form.phone,
      contact_email: form.contact_email,
      emergency_contact: form.emergency_contact,
      timezone: form.timezone,
      currency: form.currency,
    }).eq('id', userId)
    setSavingContact(false)
    setContactSaved(true)
    router.refresh()
    setTimeout(() => setContactSaved(false), 2500)
  }

  async function changePassword() {
    if (password.length < 8) { setPwMsg('Use at least 8 characters.'); return }
    setSavingPw(true)
    setPwMsg('')
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSavingPw(false)
    if (error) setPwMsg(error.message)
    else { setPwMsg('Password updated.'); setPassword('') }
  }

  async function signOut() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User size={16} /> Contact info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Display name" value={form.display_name ?? ''} onChange={set('display_name')} placeholder="Khalil" />
          <Field label="Full name" value={form.full_name ?? ''} onChange={set('full_name')} placeholder="Khalil Khouri" />
          <Field label="Phone" type="tel" value={form.phone ?? ''} onChange={set('phone')} placeholder="+61 …" />
          <Field label="Contact email" type="email" value={form.contact_email ?? ''} onChange={set('contact_email')} placeholder="you@example.com" />
          <Field label="Emergency contact" value={form.emergency_contact ?? ''} onChange={set('emergency_contact')} placeholder="Name · phone" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timezone" value={form.timezone} onChange={set('timezone')} />
            <Field label="Currency" value={form.currency} onChange={set('currency')} />
          </div>
          <Button onClick={saveContact} disabled={savingContact} className="w-full rounded-full gap-2">
            {savingContact ? <Loader2 size={16} className="animate-spin" /> : contactSaved ? <><Check size={16} /> Saved</> : 'Save contact info'}
          </Button>
        </CardContent>
      </Card>

      {/* Login info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><KeyRound size={16} /> Login info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account email</Label>
            <Input value={email} disabled className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newpw" className="text-xs text-muted-foreground uppercase tracking-wider">New password</Label>
            <Input id="newpw" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="h-11 rounded-xl" />
            {pwMsg && <p className="text-xs text-muted-foreground">{pwMsg}</p>}
            <Button onClick={changePassword} disabled={savingPw || !password} variant="outline" className="w-full rounded-full gap-2 mt-1">
              {savingPw ? <Loader2 size={16} className="animate-spin" /> : 'Update password'}
            </Button>
          </div>

          <Button onClick={signOut} variant="ghost" className="w-full rounded-full gap-2 text-destructive hover:text-destructive">
            <LogOut size={16} /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input type={type} value={value} onChange={onChange} placeholder={placeholder} className="h-11 rounded-xl" />
    </div>
  )
}
