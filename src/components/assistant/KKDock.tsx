'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Sparkles, X, Plus, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import StickFigure from './WalkingMan'
import KKRoamer from './KKRoamer'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What’s my weight trend this week?',
  'What’s my workout today?',
  'What’s coming up on my calendar?',
]

export default function KKDock() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [listening, setListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Close the chat panel whenever the user navigates to another page
  useEffect(() => {
    setOpen(false)
    setTyping(false)
  }, [pathname])

  // Set up speech recognition (Web Speech API) once
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-AU'
    rec.interimResults = true
    rec.continuous = false
    recognitionRef.current = rec
    setMicSupported(true)
  }, [])

  function toggleMic() {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) { rec.stop(); return }

    setOpen(true)
    setTyping(true)
    let finalText = ''
    rec.onresult = (e: any) => {
      let txt = ''
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript
      setInput(txt)
      if (e.results[e.results.length - 1].isFinal) finalText = txt
    }
    rec.onend = () => {
      setListening(false)
      setTyping(false)
      if (finalText.trim()) send(finalText.trim())
    }
    rec.onerror = () => { setListening(false); setTyping(false) }
    try { rec.start(); setListening(true) } catch { /* already started */ }
  }

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    if (!open) setOpen(true)
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: msg }])

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, message: msg }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (!convId) setConvId(data.conversationId)
      router.refresh()
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong — try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    setConvId(null)
    setMessages([])
  }

  // KK roams across the box until you tap to type (or start composing)
  const roaming = !typing && input.length === 0

  return (
    <>
      {/* Expanded chat panel */}
      {open && (
        <div className="fixed left-0 right-0 lg:left-64 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 top-16 z-40 flex flex-col bg-background border-t border-border">
          <div className="max-w-lg mx-auto w-full flex flex-col h-full">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground">
                  <Sparkles size={15} />
                </span>
                <span className="font-bold tracking-tight">KK</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={newChat} title="New chat"><Plus size={16} /></Button>
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)} title="Close"><X size={16} /></Button>
              </div>
            </div>

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
          </div>
        </div>
      )}

      {/* Docked input bar — above bottom nav on mobile, at the bottom on desktop */}
      <div className="fixed left-0 right-0 lg:left-64 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-lg mx-auto w-full px-3 py-2.5">
          {(listening || loading) && (
            <div className="flex items-center gap-2 px-2 pb-1.5 text-xs font-medium">
              {listening ? (
                <>
                  <span className="flex gap-0.5 items-center">
                    <span className="w-1 h-2.5 bg-destructive rounded-full animate-pulse" />
                    <span className="w-1 h-3.5 bg-destructive rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1 h-2 bg-destructive rounded-full animate-pulse [animation-delay:300ms]" />
                  </span>
                  <span className="text-destructive">Listening… tap the mic when you’re done</span>
                </>
              ) : (
                <>
                  <Loader2 size={12} className="animate-spin text-primary" />
                  <span className="text-muted-foreground">KK is thinking…</span>
                </>
              )}
            </div>
          )}
          <div className="relative flex gap-2 items-end">
            {/* Doorway — lime circle. Holds the standing figure once you tap to type. */}
            <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-primary text-primary-foreground">
              {roaming ? null : <StickFigure />}
            </span>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={() => { setOpen(true); setTyping(true) }}
              onBlur={() => setTyping(false)}
              placeholder={listening ? 'Listening…' : roaming ? '' : 'Ask KK anything…'}
              rows={1}
              className="resize-none flex-1 min-h-9 rounded-2xl"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            {micSupported && (
              <Button onClick={toggleMic} size="icon" variant={listening ? 'default' : 'outline'}
                title={listening ? 'Stop listening' : 'Talk to KK'}
                className={cn('rounded-full shrink-0', listening && 'bg-destructive text-white border-destructive animate-pulse')}>
                <Mic size={16} />
              </Button>
            )}
            <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="rounded-full shrink-0">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>

            {/* Roaming figure — slow walk to the end, 15s wait, slow walk back */}
            {roaming && <KKRoamer />}
          </div>
        </div>
      </div>
    </>
  )
}
