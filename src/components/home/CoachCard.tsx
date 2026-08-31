import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CoachCard({ text, className }: { text: string; className?: string }) {
  // Strip any markdown / em dashes the model may have added
  const clean = text
    .replace(/\*\*|\*|__|_|`|~~/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s*[—–]\s*/g, ' - ')
    .trim()
  return (
    <Card className={cn('border-primary/20 bg-primary/5', className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{clean}</p>
        </div>
      </CardContent>
    </Card>
  )
}
