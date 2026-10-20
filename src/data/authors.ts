import type { Author } from '../types'

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const bios: Omit<Author, 'slug'>[] = [
  {
    name: 'Vicki Vale',
    title: 'Senior correspondent',
    bio: 'Vale has covered Gotham’s night desk since the first edition in 2006. Crime, society, and the stories the GCPD would rather caption as weather.',
  },
  {
    name: 'Jack Ryder',
    title: 'Night editor',
    bio: 'If it happens after midnight, Ryder already has a source. He runs the late city run and still answers the tip line himself.',
  },
  {
    name: 'Alexander Knox',
    title: 'City Hall bureau',
    bio: 'Twenty years of watching Gotham pretend it has a plan. Knox keeps the hearing transcripts, the voting records, and a thermos of something worse than coffee.',
  },
  {
    name: 'Summer Gleeson',
    title: 'Breaking news',
    bio: 'First to the scene, last to leave the copy desk. Gleeson treats a siren the way other reporters treat a press release.',
  },
  {
    name: 'Miriam Falk',
    title: 'Politics editor',
    bio: 'Budget hearings are her idea of a thriller. Falk came over from the Gazette in 2008 and has not forgiven City Hall for the overtime.',
  },
  {
    name: 'Leland Cheung',
    title: 'Business desk',
    bio: 'Wayne Enterprises, the docks, and whoever actually owns the Iceberg Lounge. Cheung reads ledgers the way crime reporters read rap sheets.',
  },
  {
    name: 'Helene Voss',
    title: 'Arkham & public health',
    bio: 'The city’s other skyline is a wall of barred windows. Voss covers the asylum, the clinics, and the toxins that never stay in the lab.',
  },
  {
    name: 'Nadia Rahman',
    title: 'Culture',
    bio: 'Theatres, galleries, and whatever still sings in the Narrows after curfew. Rahman treats a restored marquee as civic infrastructure.',
  },
  {
    name: 'Theo Kane',
    title: 'Opinion',
    bio: 'Gotham’s conscience, filed at 11 p.m. Kane’s column is the one City Hall clips and the one the night shift pins to the corkboard.',
  },
  {
    name: 'Oscar Dwyer',
    title: 'Courts',
    bio: 'Indictments, mistrials, and the Falcone name in a caption. Dwyer has a preferred bench in the hallway and a least-favorite prosecutor.',
  },
]

export const AUTHORS: Author[] = bios.map((author) => ({
  ...author,
  slug: slugifyName(author.name),
}))

export function authorBySlug(slug: string) {
  return AUTHORS.find((author) => author.slug === slug)
}

export function authorByName(name: string) {
  return AUTHORS.find((author) => author.name === name)
}
