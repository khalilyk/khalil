export default function Loading() {
  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded-lg bg-foreground/10" />
      <div className="h-40 rounded-3xl bg-foreground/10" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 rounded-3xl bg-foreground/10" />
        <div className="h-28 rounded-3xl bg-foreground/10" />
      </div>
      <div className="h-40 rounded-3xl bg-foreground/5" />
    </div>
  )
}
