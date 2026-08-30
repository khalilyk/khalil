import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PushKeepAlive from '@/components/PushKeepAlive'
import { timeGlow } from '@/lib/timeGlow'

// Shared private-app shell (sidebar + header + bottom nav). Used by the (app)
// route group layout and by the /personal entry page once the user is signed in.
export default function AppChrome({ userId, name, children }: { userId: string; name: string | null; children: React.ReactNode }) {
  const glow = timeGlow()
  return (
    <div className="relative min-h-screen lg:flex">
      {/* Live time-of-day ambient glow, roaming behind every page */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="kk-bgglow a" style={{ left: '12%', top: '-6%', width: '58vw', height: '58vw', background: `radial-gradient(circle, ${glow.a}, transparent 68%)` }} />
        <span className="kk-bgglow b" style={{ left: '92%', top: '24%', width: '46vw', height: '46vw', background: `radial-gradient(circle, ${glow.b}, transparent 70%)` }} />
      </div>
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
