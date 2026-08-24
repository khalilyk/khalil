export type Project = {
  slug: string
  name: string
  cat: string
  sub: string
  city: string
  year: string
  img: string
  desc: string
}

// Selected work (sourced from the Not Normal studio site)
export const PROJECTS: Project[] = [
  { slug: '3fils', name: '3FILS', cat: 'Branding', sub: 'Reimagining a Waterfront Icon', city: 'Dubai', year: '2019', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80', desc: 'From a bold idea to a dining experience that redefined a category. We built more than a brand, we built obsession, with every plate and touchpoint designed to be remembered.' },
  { slug: 'revolver', name: 'Revolver', cat: 'Identity', sub: 'A Neighbourhood Bar, Reborn', city: 'Sydney', year: '2021', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1600&q=80', desc: 'A neighbourhood bar reimagined as a cultural anchor. Quiet rebellion designed into every detail, from the identity to the room people never want to leave.' },
  { slug: 'maison-dali', name: 'Maison Dali', cat: 'Branding', sub: 'Surrealism, Served', city: 'Beirut', year: '2022', img: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=1600&q=80', desc: 'Surrealism on a plate. We built a world, not a logo. Each touchpoint a different act in the same play, designed to surprise and seduce in equal measure.' },
  { slug: 'oakberry', name: 'Oakberry', cat: 'Content', sub: 'A Healthy Habit Made Iconic', city: 'Dubai', year: '2023', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80', desc: 'Visual direction that turned a healthy habit into a status symbol. Crave-worthy frame by frame, built to be screenshot, shared and remembered.' },
  { slug: 'bennys', name: "Benny's", cat: 'Identity', sub: 'A Room You Never Leave', city: 'Sydney', year: '2024', img: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1600&q=80', desc: "Concept, identity and energy for a room people don't want to leave. A brand built around the feeling of a great night that never quite ends." },
  { slug: 'kinoya', name: 'Kinoya', cat: 'Branding', sub: 'An Izakaya With a Soul', city: 'Dubai', year: '2022', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80', desc: 'An izakaya with a soul. A warm, lived-in identity that carries the intimacy of a Tokyo back-alley into a Dubai dining room.' },
  { slug: 'tonys-woodfire', name: "Tony's Woodfire", cat: 'Content', sub: 'Fire, Smoke & Story', city: 'Sydney', year: '2023', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80', desc: 'Fire, smoke and story. A bold, tactile brand built around the primal pull of cooking over open flame.' },
  { slug: 'shanghai-me', name: 'Shanghai Me', cat: 'Identity', sub: 'Old-World Glamour, Rebuilt', city: 'Dubai', year: '2021', img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80', desc: 'Old-world glamour, rebuilt for today. A cinematic identity steeped in 1930s Shanghai, dialled up for a modern fine-dining stage.' },
  { slug: 'mimi-kakushi', name: 'Mimi Kakushi', cat: 'Branding', sub: '1920s Osaka, Reborn in Dubai', city: 'Dubai', year: '2024', img: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1600&q=80', desc: '1920s Osaka reborn in Dubai. A richly detailed world of jazz-age Japan, translated into every plate, menu and surface.' },
  { slug: 'print-paradise', name: 'Print Paradise', cat: 'Print', sub: 'Editorial Meets Hospitality', city: 'Beirut', year: '2025', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80', desc: 'Where editorial meets hospitality. A brand that reads like a magazine and tastes like a memory, printed across every surface worth touching.' },
]

export const getProject = (slug: string) => PROJECTS.find(p => p.slug === slug)
