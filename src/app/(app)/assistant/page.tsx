import { createClient } from '@/lib/supabase/server'
import AssistantShell from '@/components/assistant/AssistantShell'

export default async function AssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id,title,updated_at')
    .order('updated_at', { ascending: false })
    .limit(20)

  return <AssistantShell userId={user.id} conversations={conversations ?? []} />
}
