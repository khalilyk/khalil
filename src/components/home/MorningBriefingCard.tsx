import { Sparkles } from 'lucide-react'

export default function MorningBriefingCard({ lines }: { lines: string[] }) {
  if (!lines.length) return null
  return (
    <div className="rounded-3xl bg-neutral-900 text-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground"><Sparkles size={14} /></span>
        <span className="font-semibold">Today’s briefing</span>
      </div>
      <ul className="space-y-1.5">
        {lines.map((l, i) => (
          <li key={i} className="text-sm text-white/85 leading-relaxed">{l}</li>
        ))}
      </ul>
    </div>
  )
}
