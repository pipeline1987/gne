import { AUTHORS } from '../data/authors'
import { TOPICS, type Article, type SearchFilters } from '../types'
import { formatRange } from './format'
import { searchArticles } from './search'

export type FacetBucket = {
  value: string
  label: string
  count: number
}

export type DatePreset = {
  id: string
  label: string
  from: string
  to: string
}

export const DECADES: DatePreset[] = [
  { id: '2000s', label: '2006–09', from: '2006-01-01', to: '2009-12-31' },
  { id: '2010s', label: '2010–19', from: '2010-01-01', to: '2019-12-31' },
  { id: '2020s', label: '2020–26', from: '2020-01-01', to: '2026-12-31' },
]

export function yearPreset(year: number): DatePreset {
  return {
    id: String(year),
    label: String(year),
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  }
}

export function selectedPreset(filters: SearchFilters, presets: DatePreset[]) {
  if (!filters.from || !filters.to) return null
  return presets.find((preset) => preset.from === filters.from && preset.to === filters.to) ?? null
}

function countBy<K extends string>(articles: Article[], key: (article: Article) => K) {
  const tallies = new Map<K, number>()
  for (const article of articles) {
    const value = key(article)
    tallies.set(value, (tallies.get(value) ?? 0) + 1)
  }
  return tallies
}

function inRange(date: string, from: string, to: string) {
  return date >= from && date <= to
}

export function buildFacets(articles: Article[], filters: SearchFilters) {
  const forDesk = searchArticles(articles, { ...filters, topic: '' })
  const forByline = searchArticles(articles, { ...filters, author: '' })
  const forDate = searchArticles(articles, { ...filters, from: '', to: '' })

  const topicCounts = countBy(forDesk, (article) => article.topic)
  const authorCounts = countBy(forByline, (article) => article.author)
  const yearCounts = countBy(forDate, (article) => article.date.slice(0, 4))

  const desks: FacetBucket[] = TOPICS.map((topic) => ({
    value: topic,
    label: topic,
    count: topicCounts.get(topic) ?? 0,
  })).filter((bucket) => bucket.count > 0 || bucket.value === filters.topic)

  const bylines: FacetBucket[] = AUTHORS.map((author) => ({
    value: author.name,
    label: author.name,
    count: authorCounts.get(author.name) ?? 0,
  }))
    .filter((bucket) => bucket.count > 0 || bucket.value === filters.author)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

  const years: FacetBucket[] = [...yearCounts.entries()]
    .map(([year, count]) => ({
      value: year,
      label: year,
      count,
    }))
    .sort((a, b) => Number(b.value) - Number(a.value))

  const decades: FacetBucket[] = DECADES.map((decade) => ({
    value: decade.id,
    label: decade.label,
    count: forDate.filter((article) => inRange(article.date, decade.from, decade.to)).length,
  })).filter((bucket) => bucket.count > 0 || selectedPreset(filters, DECADES)?.id === bucket.value)

  return {
    desks,
    bylines,
    years,
    decades,
    deskTotal: forDesk.length,
    bylineTotal: forByline.length,
    dateTotal: forDate.length,
  }
}

export type FilterChip = {
  id: string
  label: string
  next: SearchFilters
}

export function activeChips(filters: SearchFilters): FilterChip[] {
  const chips: FilterChip[] = []
  const query = filters.q.trim()
  if (query) {
    chips.push({ id: 'q', label: `“${query}”`, next: { ...filters, q: '' } })
  }
  if (filters.topic) {
    chips.push({
      id: 'topic',
      label: filters.topic,
      next: { ...filters, topic: '' },
    })
  }
  if (filters.author) {
    chips.push({
      id: 'author',
      label: filters.author,
      next: { ...filters, author: '' },
    })
  }
  if (filters.from || filters.to) {
    const decade = selectedPreset(filters, DECADES)
    const asYear =
      filters.from &&
      filters.to &&
      filters.from.endsWith('-01-01') &&
      filters.to.endsWith('-12-31') &&
      filters.from.slice(0, 4) === filters.to.slice(0, 4)
        ? filters.from.slice(0, 4)
        : null
    chips.push({
      id: 'date',
      label: decade?.label ?? asYear ?? formatRange(filters.from, filters.to),
      next: { ...filters, from: '', to: '' },
    })
  }
  return chips
}

export function hasFacets(filters: SearchFilters) {
  return Boolean(
    filters.q.trim() || filters.topic || filters.author || filters.from || filters.to,
  )
}
