'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Plus, Send } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Conversation = { id: string; title: string | null; updated_at: string }
type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What\'s my weight trend this week?',
  'Show my anchors for today',
  'What\'s coming up on my calendar?',
]

export default function AssistantShell({ userId, conversations }: {
  userId: string; conversations: Conversation[]
}) {
  const router = useRouter()
  const [convId, setConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: msg }])

    const res = await fetch('/api/assistant/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, message: msg })
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    if (!convId) setConvId(data.conversationId)
    setLoading(false)
    router.refresh()
  }

  function newConversation() {
    setConvId(null)
    setMessages([])
    setShowSidebar(false)
  }

  async function loadConversation(id: string) {
    setConvId(id)
    setShowSidebar(false)
    const res = await fetch(`/api/assistant/history?id=${id}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setShowSidebar(!showSidebar)} className="text-sm text-muted-foreground hover:text-foreground">
          Conversations
        </button>
        <Button size="sm" variant="ghost" onClick={newConversation}><Plus size={16} /></Button>
      </div>

      {/* Sidebar overlay */}
      {showSidebar && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur px-4 py-4 flex flex-col max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium">Conversations</p>
            <Button size="sm" variant="ghost" onClick={() => setShowSidebar(false)}>✕</Button>
          </div>
          <Button variant="outline" className="mb-4" onClick={newConversation}><Plus size={14} className="mr-2" /> New conversation</Button>
          <ScrollArea className="flex-1">
            {conversations.map(c => (
              <button key={c.id} onClick={() => loadConversation(c.id)}
                className={cn('w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted mb-1', c.id === convId && 'bg-muted')}>
                <p className="text-sm font-medium truncate">{c.title ?? 'Conversation'}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(c.updated_at), 'd MMM')}</p>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground text-center">What would you like to know?</p>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="w-full text-left text-sm px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors">
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                  m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={14} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about your data…"
            rows={1} className="resize-none flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
