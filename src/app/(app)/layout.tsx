import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import KKDock from '@/components/assistant/KKDock'

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
        <KKDock />
        <BottomNav />
      </div>
    </div>
  )
}
