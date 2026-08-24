import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PROJECTS, getProject } from '@/lib/projects'

const RED = '#e5342b'
const GREY = '#a3a09b'
const INK = '#141414'
const CREAM = '#f4f2ed'

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) return { title: 'Work — Khalil Khouri' }
  return { title: `${p.name} — Khalil Khouri`, description: p.desc, robots: { index: true, follow: true } }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) notFound()

  const idx = PROJECTS.findIndex(x => x.slug === p.slug)
  const next = PROJECTS[(idx + 1) % PROJECTS.length]

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: CREAM, color: INK }}>
      <div className="max-w-[1150px] mx-auto px-6 lg:px-16 py-7 lg:py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-semibold" style={{ color: GREY }}>
          <Link href="/" className="hover:opacity-70 transition-opacity">kk<span style={{ color: RED }}>.</span></Link>
          <span>/</span>
          <Link href="/?view=portfolio" className="hover:opacity-70 transition-opacity">portfolio</Link>
          <span>/</span>
          <span style={{ color: INK }}>{p.name}</span>
        </nav>

        <div className="mt-8 lg:mt-12 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="overflow-hidden rounded-2xl bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.img} alt={p.name} className="w-full aspect-[4/3] object-cover" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: RED }}>{p.cat}</span>
            <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">{p.name}</h1>
            <p className="mt-2 text-lg font-medium">{p.sub}</p>
            <p className="mt-5 text-base leading-relaxed" style={{ color: '#3a3733' }}>{p.desc}</p>
            <p className="mt-5 text-xs uppercase tracking-widest" style={{ color: GREY }}>{p.city} · {p.year}</p>

            <div className="mt-8 flex items-center gap-6 text-sm font-semibold">
              <Link href="/?view=contact" className="group inline-flex items-center gap-1.5" style={{ color: RED }}>
                start a project
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link href={`/work/${next.slug}`} className="hover:opacity-70 transition-opacity" style={{ color: GREY }}>
                next: {next.name}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
