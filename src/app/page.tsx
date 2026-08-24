import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/supabase/server'
import PortfolioLanding from '@/components/portfolio/PortfolioLanding'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khalil Khouri - Concept Creator - Sydney. Dubai. Beirut',
  description: 'Brand builder, creative thinker and curious mind. I turn ideas across hospitality, property and print into brands people remember.',
  robots: { index: true, follow: true },
}

export default async function Landing() {
  // Logged in? Go straight to the private app.
  const user = await getCachedUser()
  if (user) redirect('/personal')
  return <PortfolioLanding />
}
