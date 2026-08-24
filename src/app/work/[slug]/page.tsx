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

function NavLink({ n, label, href }: { n: string; label: string; href: string }) {
  return (
    <Link href={href} className="whitespace-nowrap hover:opacity-60 transition-opacity">
      <span className="hidden sm:inline" style={{ color: GREY }}>{n} </span>{label}.
    </Link>
  )
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) notFound()

  const idx = PROJECTS.findIndex(x => x.slug === p.slug)
  const next = PROJECTS[(idx + 1) % PROJECTS.length]

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: CREAM, color: INK }}>
      {/* Header (same as the landing) */}
      <header className="flex items-baseline justify-between gap-4 px-6 lg:px-16 py-6 lg:py-7 max-w-[1500px] w-full mx-auto shrink-0">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">kk<span style={{ color: RED }}>.</span></Link>
        <nav className="flex gap-5 sm:gap-8 lg:gap-12 text-sm sm:text-base font-semibold">
          <NavLink n="01" label="about" href="/?view=about" />
          <NavLink n="02" label="select works" href="/?view=portfolio" />
          <NavLink n="03" label="contact" href="/?view=contact" />
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 lg:px-16 py-4 lg:py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-semibold" style={{ color: GREY }}>
          <Link href="/?view=portfolio" className="hover:opacity-70 transition-opacity">select works</Link>
          <span>/</span>
          <span style={{ color: INK }}>{p.name}</span>
        </nav>

        <div className="mt-6 lg:mt-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="overflow-hidden bg-black/5 lg:sticky lg:top-6 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.img} alt={p.name} className="w-full aspect-[4/3] object-cover" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: RED }}>{p.cat}</span>
            <h1 className="mt-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">{p.name}</h1>
            <p className="mt-2 text-lg font-medium">{p.sub}</p>
            <div className="mt-5 space-y-3 text-base leading-relaxed" style={{ color: '#3a3733' }}>
              {p.desc.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
            </div>
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

        {/* Gallery */}
        {p.images.length > 1 && (
          <div className="mt-10 lg:mt-14 grid grid-cols-2 lg:grid-cols-3 gap-3">
            {p.images.map((src, i) => (
              <div key={i} className="overflow-hidden bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${p.name} ${i + 1}`} loading="lazy" className="w-full aspect-square object-cover" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer (same as the landing) */}
      <footer className="shrink-0 max-w-[1500px] w-full mx-auto px-6 lg:px-16 py-4 flex flex-col items-center gap-1 text-center text-xs lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:text-left" style={{ color: GREY }}>
        <span>© {new Date().getFullYear()} Khalil Khouri. All rights reserved.</span>
      </footer>
    </div>
  )
}
