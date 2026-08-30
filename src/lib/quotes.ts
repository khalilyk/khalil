// A rotating set of motivational lines - one per day, deterministic.
import { getDayOfYear } from 'date-fns'

const QUOTES: string[] = [
  'Small steps every day add up to big change.',
  'Discipline is choosing what you want most over what you want now.',
  'You don’t have to be extreme, just consistent.',
  'The best project you’ll ever work on is you.',
  'Show up for yourself, especially on the hard days.',
  'Progress, not perfection.',
  'What you do today is buying the life you want tomorrow.',
  'Motivation gets you started; habit keeps you going.',
  'A little progress each day adds up to big results.',
  'Your future self is watching you right now.',
  'Consistency compounds.',
  'Don’t count the days, make the days count.',
  'The pain of discipline weighs ounces; regret weighs tons.',
  'Win the morning, win the day.',
  'You are what you repeatedly do.',
  'Fall in love with the process and the results will come.',
  'Comfort is the enemy of progress.',
  'Health is the crown that only the sick can see.',
  'Take care of your body - it’s the only place you have to live.',
  'The secret of getting ahead is getting started.',
  'Energy and persistence conquer all things.',
  'Every action you take is a vote for who you want to become.',
  'Slow is smooth, smooth is fast.',
  'Do something today your future self will thank you for.',
  'Strive for progress, not perfection.',
  'The only bad workout is the one that didn’t happen.',
  'Dream big. Start small. Act now.',
  'Wealth is the ability to fully experience life.',
  'Direction is more important than speed.',
  'Be stronger than your excuses.',
]

export function quoteOfTheDay(date: Date): string {
  return QUOTES[getDayOfYear(date) % QUOTES.length]
}
