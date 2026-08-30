import { createClient, getCachedUser } from '@/lib/supabase/server'
import { periodSummary } from '@/lib/summary'
import SummaryView from '@/components/review/SummaryView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ReviewPage() {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()

  const [week, month, year] = await Promise.all([
    periodSummary(supabase, user.id, 'week'),
    periodSummary(supabase, user.id, 'month'),
    periodSummary(supabase, user.id, 'year'),
  ])

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6">
      <div className="kk-rise">
        <p className="text-sm text-muted-foreground">How you&apos;re tracking</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95]">Your review<span className="text-primary">.</span></h1>
      </div>

      <Tabs defaultValue="week">
        <TabsList className="w-full max-w-md h-11 bg-card border border-border shadow-sm rounded-full p-1">
          <TabsTrigger value="week" className="flex-1 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm">Weekly</TabsTrigger>
          <TabsTrigger value="month" className="flex-1 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm">Monthly</TabsTrigger>
          <TabsTrigger value="year" className="flex-1 rounded-full data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm">Annual</TabsTrigger>
        </TabsList>
        <TabsContent value="week" className="mt-6"><SummaryView s={week} /></TabsContent>
        <TabsContent value="month" className="mt-6"><SummaryView s={month} /></TabsContent>
        <TabsContent value="year" className="mt-6"><SummaryView s={year} /></TabsContent>
      </Tabs>
    </div>
  )
}
