import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'
import type { BusinessKey } from '@/lib/work'

export type LiveStat = {
  revenue: number
  pending: { title: string; amount: number | null; status: string }[]
}

function client(url?: string, key?: string) {
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Print Paradise (Supabase e-commerce: orders) ─────────
async function printParadise(): Promise<LiveStat | null> {
  const db = client(process.env.PP_SUPABASE_URL, process.env.PP_SUPABASE_KEY)
  if (!db) return null
  try {
    const { data, error } = await db.from('orders').select('total, status, created_at').order('created_at', { ascending: false })
    if (error || !data) return null
    const paid = new Set(['shipped', 'delivered'])
    const revenue = data.filter(o => paid.has(o.status)).reduce((s, o) => s + Number(o.total ?? 0), 0)
    const pending = data
      .filter(o => ['quote', 'pending', 'in_production', 'ready'].includes(o.status))
      .slice(0, 6)
      .map(o => ({ title: `Order · ${o.status.replace('_', ' ')}`, amount: Number(o.total ?? 0), status: o.status }))
    return { revenue, pending }
  } catch { return null }
}

// ── Not Normal (Supabase agency: invoices w/ jsonb items) ─
type InvItem = { qty: number; rate: number; discount: number }
function invoiceTotal(items: InvItem[], taxRate: number, discount: number) {
  const sub = (items ?? []).reduce((s, it) => s + (Number(it.qty || 0) * Number(it.rate || 0) - Number(it.discount || 0)), 0)
  return (sub - Number(discount || 0)) * (1 + Number(taxRate || 0) / 100)
}
// One pool per connection string (invoicing apps share the same schema).
const invoicePools = new Map<string, Pool>()
function invoiceDb(url?: string) {
  if (!url) return null
  let pool = invoicePools.get(url)
  if (!pool) { pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: true }, max: 2 }); invoicePools.set(url, pool) }
  return pool
}
async function invoiceStats(url?: string): Promise<LiveStat | null> {
  const pool = invoiceDb(url)
  if (!pool) return null
  try {
    const { rows } = await pool.query(
      `select number, subject, doc_type, status, items, tax_rate, discount
       from invoices where doc_type = 'invoice' order by created_at desc`
    )
    const revenue = rows
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + invoiceTotal(i.items, i.tax_rate, i.discount), 0)
    const pending = rows
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .slice(0, 6)
      .map(i => ({ title: `${i.number}${i.subject ? ` · ${i.subject}` : ''}`, amount: invoiceTotal(i.items, i.tax_rate, i.discount), status: i.status }))
    return { revenue, pending }
  } catch { return null }
}

// Cache the external lookups briefly - NN's Postgres is in us-east-1, so
// hitting it on every page load makes /work feel sluggish from Sydney.
let cache: { at: number; data: Partial<Record<BusinessKey, LiveStat>> } | null = null
const TTL_MS = 5 * 60_000

export async function getBusinessStats(): Promise<Partial<Record<BusinessKey, LiveStat>>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data
  // BRIC pulls from its own invoicing DB; falls back to the studio DB if BRIC's isn't set yet.
  const [pp, bric] = await Promise.all([
    printParadise(),
    invoiceStats(process.env.BRIC_POSTGRES_URL || process.env.NN_POSTGRES_URL),
  ])
  const out: Partial<Record<BusinessKey, LiveStat>> = {}
  if (pp) out.print_paradise = pp
  if (bric) out.bric = bric
  if (Object.keys(out).length) cache = { at: Date.now(), data: out }
  return out
}
