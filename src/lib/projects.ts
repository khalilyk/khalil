export type Project = {
  slug: string
  name: string
  cat: string
  sub: string
  city: string
  year: string
  img: string
  images: string[]
  desc: string
}

const NN = 'https://thisisnn.com'
const u = (path: string) => (path.startsWith('http') ? path : NN + path)

type Raw = Omit<Project, 'img' | 'images'> & { img: string; images: string[] }

const RAW: Raw[] = [
  {
    slug: 'tonton-bakes', name: 'Tonton Bakes', cat: 'Branding', sub: 'A little everyday magic.', city: 'Dubai', year: '2024',
    img: '/projects/tonton/DSCF3233-Enhanced-NR-scaled.jpg',
    images: ['/projects/tonton/DSCF3233-Enhanced-NR-scaled.jpg', '/projects/tonton/tontonbakes-hoodie.jpg', '/projects/tonton/nn-tontonlogo.jpg', '/projects/tonton/tontonbakes-box.jpg', '/projects/tonton/DSCF3134-Enhanced-NR-scaled.jpg', '/projects/tonton/DSCF3125-Enhanced-NR-scaled.jpg', '/projects/tonton/tontonbakes-phone.jpg', '/projects/tonton/DSCF3288-Enhanced-NR-scaled.jpg', '/projects/tonton/nn-tontonweb-scaled.jpg'],
    desc: "We were tasked with building a brand that felt nostalgic yet fresh, charming without being cliché. Inspired by French and Italian bakery traditions and the warmth of the word 'Tonton' (French for uncle), we set out to create something that felt familiar, but never ordinary. We developed a hand-drawn identity system that feels artisanal but modern - pairing soft lines and playful details with a sophisticated palette of pastel purple and green. The logo, brand marks and tone of voice all reflect the essence of Tonton: approachable, slightly cheeky, and rooted in good taste.\n\nThe website was designed to feel like walking into the shop itself - inviting, warm, and filled with personality. Photography captured the hands-on baking process, crumb-close textures, and the kind of natural light that makes you want to slow down and order another pastry. We also created uniforms that feel like part of the story: clean, comfortable and unmistakably Tonton.",
  },
  {
    slug: 'kinoya', name: 'Kinoya', cat: 'Content', sub: 'An izakaya with a soul.', city: 'Dubai', year: '2025',
    img: '/projects/kinoya/nn-kinoyaheader.jpg',
    images: ['/projects/kinoya/nn-kinoyaheader.jpg', '/projects/kinoya/nn-kinoya2.jpg', '/projects/kinoya/nn-kinoya4.jpg', '/projects/kinoya/nn-kinoya1.jpg', '/projects/kinoya/nn-kinoya5.jpg', '/projects/kinoya/nn-kinoya3.jpg'],
    desc: "Nestled in the heart of Dubai, Kinoya is more than a ramen bar - it's a cultural ritual. As a Michelin Bib Gourmand-awarded restaurant and one of the UAE's most beloved homegrown concepts, Kinoya embodies the warmth of an izakaya with the soul of Tokyo's backstreets. Our task was to capture this spirit through a lifestyle shoot that reflects not just the food, but the feeling: comforting, communal, and deeply personal.\n\nThe shoot spotlighted Kinoya's signature ramen, sushi, gyoza, and drinks in their natural habitat - steaming bowls mid-slurp, hands reaching for shared plates, and golden hour light pouring over wood textures and soft shadows. We leaned into the honest, lived-in beauty of the space, highlighting the quiet moments between bites and the energy that pulses through every seat at the counter.\n\nOur visual approach celebrated the Kinoya ethos: craftsmanship without pretension. Whether it was the swirl of noodles in broth or the glint of sake glasses clinking together, every frame aimed to tell a story of passion, precision, and place.",
  },
  {
    slug: 'piehaus', name: 'PieHaus', cat: 'Content', sub: 'Flaky pies, bold coffee.', city: 'Dubai', year: '2025',
    img: '/projects/piehaus/nn-ph-spinach.jpg',
    images: ['/projects/piehaus/nn-ph-spinach.jpg', '/projects/piehaus/nn-ph-granola.jpg', '/projects/piehaus/nn-ph-pastrami.jpg', '/projects/piehaus/nn-ph-coffee.jpg', '/projects/piehaus/nn-ph-olives.jpg', '/projects/piehaus/nn-ph-hummus.jpg'],
    desc: "We spent the day behind the scenes at PieHaus, shooting the new menu that brings 21grams' signature soul to a fresh concept. From hand-stretched Balkan pies to iced lattes and signature sips, every detail was captured to reflect the warmth, texture, and flavour that define PieHaus. Think golden layers, coffee steam, and that unmistakable just-out-the-oven glow.\n\nThe shoot was all about celebrating the craft - crisp edges, gooey centres, and drinks that hit just right. Whether you're popping in for a quick coffee or settling in for a slice (or two), the new PieHaus menu is baked to be remembered and now, it looks just as good as it tastes.",
  },
  {
    slug: 'voyage-concierge', name: 'Voyage Concierge', cat: 'Branding', sub: 'Exclusive journeys, extraordinary experiences.', city: 'Dubai', year: '2025',
    img: '/projects/voyage/nn-voyage.jpg',
    images: ['/projects/voyage/nn-voyage.jpg', '/projects/voyage/nn-voyagestamps1.jpg', '/projects/voyage/nn-voyagetote1.jpg', '/projects/voyage/nn-voyageshirt.jpg', '/projects/voyage/nn-voyagenote.jpg'],
    desc: "Voyage Concierge came to us with a clear mission: to redefine how the world experiences travel, seamless, intimate, and utterly bespoke. Our role was to translate that vision into a refined brand identity that felt as effortless and considered as the journeys they design.\n\nFrom the elegant logo to a warm, editorial tone of voice, every element was crafted to reflect the brand's promise of understated luxury and world-class personalization. We drew inspiration from vintage luggage tags, global coordinates, and handwritten notes, symbols of a time when travel was an art, not a transaction.\n\nBeyond the visual identity, we helped Voyage shape its brand story, one that speaks not to tourists, but to travelers. People who value the unseen, the tailored, the quietly spectacular.",
  },
  {
    slug: 'genesis-coffee-co', name: 'Genesis Coffee Co.', cat: 'Branding', sub: "Start strong or don't start at all.", city: 'Dubai', year: '2025',
    img: '/projects/genesis/genesis-coffeecup.jpg',
    images: ['/projects/genesis/genesis-coffeecup.jpg', '/projects/genesis/genesiscoffee-handsof-scaled.png', '/projects/genesis/genesis-stickerroll1.jpg', '/projects/genesis/genesis-coffeebox.jpg', '/projects/genesis/gensesis-beans.jpg', '/projects/genesis/genesis-buckethat.jpg', '/projects/genesis/genesis-coffeebag.jpg'],
    desc: "Genesis Coffee Co was built from the ground up as an in-house project by Not Normal - a brand that believes in standing out, or not showing up at all. The concept began with a single idea: coffee marks the start of the day, just as Genesis marks the start of life.\n\nFrom that came a brand identity that feels raw, loud and intentional. We paired neon green with deep black to create contrast and clarity, using the all-caps IMPACT font to make every word feel urgent and alive. It's not soft. It's not polite. It's coffee for people who start things.\n\nFrom the visual language to the tone of voice, we stripped away the fluff and leaned into a confident, stripped-back look that celebrates the process - from hand-picked beans to small-batch UAE roasts. Genesis isn't just a coffee brand - it's a statement. One that says: start strong or don't start at all.",
  },
  {
    slug: 'luckys', name: "Lucky's", cat: 'Branding', sub: 'A local legend, back on the road.', city: 'Sydney', year: '2026',
    img: '/projects/luckys/luckys-1.png',
    images: ['/projects/luckys/luckys-1.png', '/projects/luckys/luckys-tabox-scaled.jpg', '/projects/luckys/luckys-truck-scaled.jpg', '/projects/luckys/luckys-tartaresauce.jpg', '/projects/luckys/luckys-shirt.jpg', '/projects/luckys/luckys-aframe.jpg', '/projects/luckys/luckys-2.png', '/projects/luckys/luckys-3.png', '/projects/luckys/luckys-tote.jpg'],
    desc: "Some places don't need a reintroduction. They just need a second life.\n\nFor over 25 years, Padstow Seafoods was part of the neighbourhood routine. Families lining up on weekends, kids growing up on the same order, and Lucky behind the counter doing what he did best, simple, honest fish and chips done right.\n\nWhen the shop closed, the food stopped, but the memory didn't. Lucky's is our way of bringing that feeling back, not as a replica, but as a revival. A mobile fish and chip truck built on nostalgia, personality, and a stripped-back menu that focuses on what made it special in the first place.\n\nWe worked on the full brand direction from the ground up. Naming, identity, tone of voice, and visual system. From logo and colour palette to truck signage, packaging and uniforms, every touchpoint was designed to feel fun, confident and a little bit loud, just like the queues Lucky used to have.",
  },
  {
    slug: 'tonys-woodfire', name: "Tony's Woodfire", cat: 'Branding', sub: 'Not just a slice. A stance.', city: 'Sydney', year: '2026',
    img: '/projects/tonys/tonys-pizzabox.png',
    images: ['/projects/tonys/tonys-pizzabox.png', '/projects/tonys/tonys-stools.png', '/projects/tonys/tonys-paper.jpg', '/projects/tonys/tonys-menu.png', '/projects/tonys/tonys-pizzachef.png', '/projects/tonys/tonys-lightbox.png'],
    desc: "We created a full world of branded collateral for Tony's designed to match the heat of the oven and the buzz of a Friday night rush. From the logo to punchy menus and box designs, stickers and custom signage, every piece was built to feel bold, familiar and unmistakably Tony's.\n\nThis wasn't just design for the walls - it was design for the neighbourhood. Whether you're grabbing a quick slice, waiting by the curb or opening a box at home, the brand shows up strong. Loud without shouting. Classic without feeling dated. Confident, nostalgic and just the right amount of attitude - exactly how a proper pizza joint should feel.",
  },
  {
    slug: 'yava', name: 'Yava', cat: 'Content', sub: 'The soul behind the food.', city: 'Dubai', year: '2024',
    img: '/projects/yava/yava-1.jpg',
    images: ['/projects/yava/yava-1.jpg', '/projects/yava/yava-2.jpg', '/projects/yava/yava-3.jpg', '/projects/yava/yava-5.jpg', '/projects/yava/yava-4.jpg'],
    desc: "With Yava, the goal wasn't just to show the food - it was to show the soul behind it. We captured moments of the owner in their element - pouring coffee, plating dishes, sharing stories - to humanize the brand and deepen its emotional connection with guests. Every shot was designed to feel lived-in, intimate, and real.\n\nPR efforts were focused on positioning Yava not just as a restaurant, but as a cultural experience. We curated the narrative to showcase the founder's personal journey, bringing media attention to the people behind the food.\n\nBecause hospitality is personal - and when you share the face behind the flavour, it resonates. At Not Normal, we don't just elevate brands. We introduce stories worth remembering.",
  },
]

export const PROJECTS: Project[] = RAW.map(p => ({ ...p, img: u(p.img), images: p.images.map(u) }))

export const getProject = (slug: string) => PROJECTS.find(p => p.slug === slug)
