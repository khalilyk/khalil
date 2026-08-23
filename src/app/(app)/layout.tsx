import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PushKeepAlive from '@/components/PushKeepAlive'
import type { Metadata } from 'next'

// The private app stays out of search indexes (only the public landing at / is indexable)
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('id', user.id).maybeSingle()
  const name = (profile as { display_name: string | null } | null)?.display_name ?? null

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header userId={user.id} name={name} />
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
      <PushKeepAlive />
    </div>
  )
}
