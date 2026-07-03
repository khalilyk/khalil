import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

let configured = false
function configure() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  configured = true
}

type Payload = { title: string; body: string; url?: string; tag?: string }

export async function sendPush(userId: string, payload: Payload) {
  configure()
  const supabase = await createServiceClient()
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
  const body = JSON.stringify(payload)

  await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      )
    } catch (e: unknown) {
      const code = (e as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', s.id).eq('user_id', userId) // stale subscription
      }
    }
  }))
}
