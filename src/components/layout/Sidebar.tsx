'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Home, Activity, Briefcase, Calendar, LineChart, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/personal', label: 'Home', icon: Home },
  { href: '/body', label: 'Body', icon: Activity },
  { href: '/work', label: 'Work', icon: Briefcase },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/review', label: 'Review', icon: LineChart },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/personal')
    router.refresh()
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-0 h-screen p-3">
        <div className="h-full rounded-3xl bg-card border border-border flex flex-col p-4">
          {/* Brand + date */}
          <div className="px-2 pt-2 pb-4">
            <p className="text-2xl font-extrabold tracking-tight leading-none">kk<span className="text-primary">.</span></p>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">{format(new Date(), 'EEEE')}</p>
            <p className="text-lg font-bold tracking-tight">{format(new Date(), 'd MMMM')}</p>
          </div>

          <nav className="flex-1 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === '/personal' ? pathname === '/personal' : pathname.startsWith(href)
              return (
                <Link key={href} href={href} className={cn(
                  'group/nav flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ease-out hover:translate-x-1',
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_12px_28px_-10px_rgba(112,137,46,0.75)] scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2}
                    className="transition-transform duration-200 group-hover/nav:scale-110 group-hover/nav:-rotate-6" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <button onClick={signOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LogOut size={18} />
            Log out
          </button>
          <p className="px-3.5 pt-2 text-xs text-muted-foreground/60">Private. Yours only.</p>
        </div>
      </div>
    </aside>
  )
}
