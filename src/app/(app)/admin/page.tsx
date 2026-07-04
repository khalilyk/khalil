import { createClient } from '@/lib/supabase/server'
import AdminSection from '@/components/admin/AdminSection'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'

type Profile = {
  display_name: string | null
  full_name: string | null
  phone: string | null
  contact_email: string | null
  emergency_contact: string | null
  timezone: string
  currency: string
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const row = (data ?? {}) as Partial<Profile>
  const profile: Profile = {
    display_name: row.display_name ?? null,
    full_name: row.full_name ?? null,
    phone: row.phone ?? null,
    contact_email: row.contact_email ?? null,
    emergency_contact: row.emergency_contact ?? null,
    timezone: row.timezone ?? 'Australia/Sydney',
    currency: row.currency ?? 'AUD',
  }

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Contact details and login</p>
      </div>
      <AdminSection userId={user!.id} email={user!.email ?? ''} profile={profile} />
      <NotificationsPanel userId={user!.id} />
    </div>
  )
}
