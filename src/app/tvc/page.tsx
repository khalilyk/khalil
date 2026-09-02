import type { Metadata } from 'next'
import CardGenerator from '@/components/tvc/CardGenerator'

export const metadata: Metadata = {
  title: 'Trading Card Generator',
  description: 'Make your own trading card — spin it, style it, customise the name, power and skills.',
  robots: { index: false, follow: false },
}

export default function TvcPage() {
  return <CardGenerator />
}
