import { getCachedUser } from '@/lib/supabase/server'
import GoalsBlock from '@/components/goals/GoalsBlock'

export default async function GoalsPage() {
  const user = await getCachedUser()
  if (!user) return null

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6">
      <div className="kk-rise">
        <p className="text-sm text-muted-foreground">What you&apos;re working toward</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95]">Goals<span className="text-primary">.</span></h1>
      </div>
      <GoalsBlock userId={user.id} categories={['Personal', 'Travel', 'Learning']} title="Life goals" />
    </div>
  )
}
