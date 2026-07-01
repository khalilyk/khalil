'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Home, DollarSign, Activity, Briefcase, Calendar, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/money', label: 'Money', icon: DollarSign },
  { href: '/body', label: 'Body', icon: Activity },
  { href: '/work', label: 'Work', icon: Briefcase },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-0 h-screen p-3">
        <div className="h-full rounded-3xl bg-sidebar text-sidebar-foreground border border-sidebar-border flex flex-col p-4">
          <div className="px-2 py-3 leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
              {format(new Date(), 'EEEE')}
            </p>
            <p className="text-xl font-bold tracking-tight">{format(new Date(), 'd MMMM')}</p>
          </div>

          <nav className="flex-1 space-y-1 mt-2">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link key={href} href={href} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <button onClick={signOut} className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors',
            'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}>
            <LogOut size={18} />
            Log out
          </button>
          <p className="px-3 pt-2 text-xs text-sidebar-foreground/40">Private. Yours only.</p>
        </div>
      </div>
    </aside>
  )
}
