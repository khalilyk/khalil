// Purpose + goal/business links for known accounts, derived from the account name.
// This delivers the labels/links without needing the (optional) DB columns.
export type AccountMeta = {
  purpose: string
  goalMatch?: string        // substring to match an active goal's title (case-insensitive)
  businessKey?: string      // key from src/lib/work BUSINESSES
}

const MAP: Record<string, AccountMeta> = {
  'main piggy bank': { purpose: 'Everyday spending & bills' },
  'smart savers': { purpose: 'Cronulla home', goalMatch: 'cronulla' },
  'print paradise business acc': { purpose: 'Print Paradise', businessKey: 'print_paradise' },
  'print paradise business account': { purpose: 'Print Paradise', businessKey: 'print_paradise' },
  'business savings': { purpose: 'BRIC + Not Normal savings', businessKey: 'bric' },
}

export function accountMeta(name: string): AccountMeta | null {
  return MAP[name.trim().toLowerCase()] ?? null
}
