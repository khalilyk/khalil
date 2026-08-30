import { format } from 'date-fns'
import { sydneyNow } from '@/lib/dates'

// Ambient glow palette for the current time of day (Sydney wall-clock).
export function timeGlow(): { a: string; b: string } {
  const hour = Number(format(sydneyNow(), 'H'))
  if (hour >= 6 && hour < 17) return { a: 'rgba(255,165,80,0.36)', b: 'rgba(255,205,120,0.28)' }  // day → orange
  if (hour >= 17 && hour < 20) return { a: 'rgba(255,120,70,0.36)', b: 'rgba(255,100,140,0.26)' } // sunset → orange/pink
  return { a: 'rgba(70,105,210,0.34)', b: 'rgba(36,52,120,0.28)' }                                // night → blue
}
