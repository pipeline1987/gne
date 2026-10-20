export const TOPICS = [
  'Crime',
  'City Hall',
  'Business',
  'Arkham',
  'Culture',
  'Opinion',
] as const

export type Topic = (typeof TOPICS)[number]

export type Author = {
  name: string
  slug: string
  title: string
  bio: string
}

export type Article = {
  slug: string
  title: string
  dek: string
  date: string
  topic: Topic
  author: string
  kicker: string
  body: string[]
  featured?: boolean
}

export type SearchFilters = {
  topic: Topic | ''
  author: string
  from: string
  to: string
  q: string
}
