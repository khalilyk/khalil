import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/supabase/server'
import PortfolioLanding from '@/components/portfolio/PortfolioLanding'
import type { Metadata } from 'next'

const TITLE = 'Khalil Khouri - Concept Creator - Sydney. Dubai. Beirut'
const DESCRIPTION = 'Brand builder, creative thinker and curious mind. I turn ideas across hospitality, property and print into brands people remember.'

export const metadata: Metadata = {
  metadataBase: new URL('https://khalilkhouri.org'),
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://khalilkhouri.org',
    siteName: 'Khalil Khouri',
    type: 'website',
    images: [{ url: '/og-k.png', width: 1200, height: 1200, alt: 'Khalil Khouri' }],
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-k.png'],
  },
}

export default async function Landing() {
  // Logged in? Go straight to the private app.
  const user = await getCachedUser()
  if (user) redirect('/personal')
  return <PortfolioLanding />
}
