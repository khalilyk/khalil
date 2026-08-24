import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PushKeepAlive from '@/components/PushKeepAlive'

// Shared private-app shell (sidebar + header + bottom nav). Used by the (app)
// route group layout and by the /personal entry page once the user is signed in.
export default function AppChrome({ userId, name, children }: { userId: string; name: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header userId={userId} name={name} />
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
      <PushKeepAlive />
    </div>
  )
}
