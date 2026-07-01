'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2, Check } from 'lucide-react'

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

type Status = 'loading' | 'unsupported' | 'denied' | 'off' | 'on' | 'busy'

export default function PushToggle() {
  const [status, setStatus] = useState<Status>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'denied') { setStatus('denied'); return }
    navigator.serviceWorker.getRegistration().then(async reg => {
      const sub = reg ? await reg.pushManager.getSubscription() : null
      setStatus(sub ? 'on' : 'off')
    }).catch(() => setStatus('off'))
  }, [])

  async function enable() {
    setStatus('busy'); setMsg('')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus(perm === 'denied' ? 'denied' : 'off'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub),
      })
      setStatus('on')
    } catch (e) {
      setMsg('Could not enable notifications.')
      setStatus('off')
    }
  }

  async function disable() {
    setStatus('busy')
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setStatus('off')
  }

  async function test() {
    setMsg('Sending…')
    const r = await fetch('/api/push/test', { method: 'POST' })
    setMsg(r.ok ? 'Sent — check your device.' : 'Failed to send.')
  }

  if (status === 'unsupported')
    return <p className="text-sm text-muted-foreground">This browser doesn’t support push notifications.</p>
  if (status === 'denied')
    return <p className="text-sm text-muted-foreground">Notifications are blocked. Enable them in your browser/site settings, then reload.</p>

  return (
    <div className="space-y-2">
      {status === 'on' ? (
        <>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Check size={15} /> Notifications are on
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={test} className="rounded-full">Send test</Button>
            <Button variant="ghost" size="sm" onClick={disable} className="rounded-full gap-1.5"><BellOff size={14} /> Turn off</Button>
          </div>
        </>
      ) : (
        <Button onClick={enable} disabled={status === 'busy'} className="w-full rounded-full gap-2">
          {status === 'busy' ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
          Enable notifications
        </Button>
      )}
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  )
}
