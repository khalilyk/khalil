import { createClient, getCachedUser } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { sydneyNow } from '@/lib/dates'
import PersonalSection from '@/components/money/PersonalSection'
import BusinessSection from '@/components/money/BusinessSection'
import BudgetsSection from '@/components/money/BudgetsSection'
import NetWorthCard from '@/components/money/NetWorthCard'
import GoalsBlock from '@/components/goals/GoalsBlock'
import ReceiptUploader from '@/components/receipts/ReceiptUploader'
import BankImport from '@/components/money/BankImport'
import AccountsList from '@/components/money/AccountsList'
import { BUSINESSES } from '@/lib/work'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function MoneyPage() {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()

  const monthStart = format(startOfMonth(sydneyNow()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(sydneyNow()), 'yyyy-MM-dd')

  const [{ data: accounts }, { data: transactions }, { data: snapshots }, { data: profile }, { data: budgets }, { data: goals }] = await Promise.all([
    supabase.from('accounts').select('*').order('type').order('name'),
    supabase.from('transactions').select('*').gte('occurred_on', monthStart).lte('occurred_on', monthEnd).order('occurred_on', { ascending: false }),
    supabase.from('balance_snapshots').select('*').order('as_of', { ascending: false }),
    supabase.from('profiles').select('currency').eq('id', user.id).maybeSingle(),
    supabase.from('budgets').select('id,category,monthly_limit'),
    supabase.from('goals').select('id,title').eq('status', 'active').order('created_at'),
  ])

  const currency = (profile as { currency: string } | null)?.currency ?? 'AUD'
  const personal = (accounts ?? []).filter(a => a.type === 'personal')
  const business = (accounts ?? []).filter(a => a.type === 'business')

  // This month's spend per category, for live budget feedback while logging a spend
  const monthByCategory: Record<string, number> = {}
  for (const t of transactions ?? []) {
    if (t.direction !== 'expense') continue
    const c = t.category ?? 'other'
    monthByCategory[c] = (monthByCategory[c] ?? 0) + Number(t.amount)
  }
  const topGoal = (goals ?? [])[0]?.title ?? null

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Money</h1>
      <ReceiptUploader userId={user.id} accounts={accounts ?? []} currency={currency}
        budgets={(budgets ?? []) as { category: string; monthly_limit: number }[]}
        monthByCategory={monthByCategory} topGoal={topGoal} />
      <BankImport userId={user.id} accounts={(accounts ?? []) as { id: string; type: 'personal' | 'business'; name: string }[]} currency={currency} />
      <NetWorthCard accounts={accounts ?? []} snapshots={snapshots ?? []} currency={currency} />
      <AccountsList
        userId={user.id}
        accounts={(accounts ?? []) as { id: string; name: string; type: 'personal' | 'business'; purpose: string | null; goal_id: string | null; business_key: string | null }[]}
        snapshots={(snapshots ?? []) as { account_id: string; balance: number; as_of: string }[]}
        goals={(goals ?? []) as { id: string; title: string }[]}
        businesses={BUSINESSES.map(b => ({ key: b.key, name: b.name }))}
        currency={currency}
      />
      <BudgetsSection userId={user.id} budgets={budgets ?? []} transactions={transactions ?? []} currency={currency} />
      <Tabs defaultValue="personal">
        <TabsList className="w-full">
          <TabsTrigger value="personal" className="flex-1">Personal</TabsTrigger>
          <TabsTrigger value="business" className="flex-1">Business</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-4">
          <PersonalSection
            userId={user.id}
            accounts={personal}
            transactions={transactions ?? []}
            snapshots={snapshots ?? []}
            currency={currency}
          />
        </TabsContent>
        <TabsContent value="business" className="mt-4">
          <BusinessSection
            userId={user.id}
            accounts={business}
            transactions={transactions ?? []}
            currency={currency}
          />
        </TabsContent>
      </Tabs>
      <GoalsBlock userId={user.id} categories={['Money']} title="Money goals" />
    </div>
  )
}
