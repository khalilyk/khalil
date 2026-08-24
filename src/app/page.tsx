import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/supabase/server'
import PortfolioLanding from '@/components/portfolio/PortfolioLanding'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khalil Khouri — Designer & Maker',
  description: 'Designer, maker, and curious mind. I turn ideas into thoughtful visuals and digital experiences.',
  robots: { index: true, follow: true },
}

export default async function Landing() {
  // Logged in? Go straight to the private app.
  const user = await getCachedUser()
  if (user) redirect('/home')
  return <PortfolioLanding />
}
