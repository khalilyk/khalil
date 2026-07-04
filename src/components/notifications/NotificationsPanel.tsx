'use client'

import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import PushToggle from '@/components/admin/PushToggle'

type Notification = {
  id: string
  title: string
  body: string | null
  type: string | null
  read: boolean
  created_at: string
}

export default function NotificationsPanel({ userId }: { userId: string }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNotifications(data)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('notifications-panel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => setNotifications(prev => [payload.new as Notification, ...prev])
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unread = notifications.filter(n => !n.read).length

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell size={16} /> Notifications
          {unread > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
              {unread}
            </span>
          )}
        </CardTitle>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5 text-xs h-8">
            <Check size={14} /> Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Push on/off for this device */}
        <div className="px-5 pb-4 border-b border-border">
          <PushToggle />
          <p className="text-xs text-muted-foreground mt-3">
            Turn this on to get check-in, water/no-snacking, and overdue-goal alerts on this device.
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">All clear — no notifications.</p>
          ) : notifications.map(n => (
            <div key={n.id} className={cn('px-5 py-3 border-t border-border first:border-t-0', !n.read && 'bg-muted/40')}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{n.title}</p>
                <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
