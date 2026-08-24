import { createClient, getCachedUser } from '@/lib/supabase/server'
import AppChrome from '@/components/layout/AppChrome'
import LoginForm from '@/components/auth/LoginForm'
import DashboardHome from './DashboardHome'
import type { Metadata } from 'next'

// The private side is never indexed (only the public landing at / is).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

// Single private entry point:
//  • signed out → the login screen
//  • signed in  → the dashboard, inside the app shell
export default async function PersonalPage() {
  const user = await getCachedUser()
  if (!user) return <LoginForm />

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('id', user.id).maybeSingle()
  const name = (profile as { display_name: string | null } | null)?.display_name ?? null

  return (
    <AppChrome userId={user.id} name={name}>
      <DashboardHome />
    </AppChrome>
  )
}
