import { format } from 'date-fns'

// The server runs in UTC but the owner lives in Sydney. Anything that
// derives "today" or a weekday on the server MUST go through these, or
// mornings (before ~10–11am AEST) land on yesterday's date.

/** A Date whose wall-clock fields reflect Australia/Sydney local time. */
export function sydneyNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
}

/** Today's date string (yyyy-MM-dd) in Sydney. */
export function todaySydney(): string {
  return format(sydneyNow(), 'yyyy-MM-dd')
}
