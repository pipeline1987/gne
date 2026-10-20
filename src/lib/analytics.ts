import { useEffect } from 'react'
import { ARTICLES } from '../data/articles'
import { SEED_ASKS } from '../data/search-asks'
import type { Article, SearchFilters } from '../types'
import { parseNaturalQuery } from './nl'
import { EMPTY_FILTERS, searchArticles } from './search'

const STORAGE_KEY = 'gne.search-ledger.v1'
const DEDUPE_MS = 2500
const LIVE_CAP = 400
const ORIGIN = Date.UTC(2026, 9, 20, 12, 0, 0)

export type SearchKind = 'natural' | 'keyword' | 'browse'

export type SearchEvent = {
  type: 'search'
  id: string
  at: string
  q: string
  topic: string
  author: string
  from: string
  to: string
  hits: number
  kind: SearchKind
  heard: string
  source: 'seed' | 'live'
}

export type ClickEvent = {
  type: 'click'
  id: string
  at: string
  searchId: string
  slug: string
  rank: number
  q: string
  source: 'seed' | 'live'
}

export type AnalyticsEvent = SearchEvent | ClickEvent

export type RankedAsk = {
  q: string
  count: number
  hits: number
  clicks: number
}

export type RankedStory = {
  slug: string
  title: string
  count: number
  avgRank: number
}

export type DayVolume = {
  date: string
  count: number
}

export type LedgerReport = {
  searches: number
  liveSearches: number
  zeros: number
  clicks: number
  ctr: number
  zeroRate: number
  naturalShare: number
  keywordShare: number
  browseShare: number
  topAsks: RankedAsk[]
  deadEnds: RankedAsk[]
  opened: RankedStory[]
  desks: { label: string; count: number }[]
  days: DayVolume[]
  recent: SearchEvent[]
}

type PendingAsk = {
  filters: SearchFilters
  hits: number
  timer: ReturnType<typeof setTimeout>
}

const listeners = new Set<() => void>()
let pending: PendingAsk | null = null
let memory: AnalyticsEvent[] | null = null
let seedCache: AnalyticsEvent[] | null = null

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeLedger(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isTrackedSearch(filters: SearchFilters) {
  return Boolean(
    filters.q.trim() || filters.topic || filters.author || filters.from || filters.to,
  )
}

function kindOf(filters: SearchFilters): SearchKind {
  if (!filters.q.trim()) return 'browse'
  return parseNaturalQuery(filters.q).natural ? 'natural' : 'keyword'
}

function heardOf(filters: SearchFilters) {
  const parsed = parseNaturalQuery(filters.q)
  return [...parsed.heard, parsed.natural && parsed.content ? parsed.content : '']
    .filter(Boolean)
    .join(' · ')
}

function signature(filters: SearchFilters, hits: number) {
  return [
    filters.q.trim().toLowerCase(),
    filters.topic,
    filters.author,
    filters.from,
    filters.to,
    String(hits),
  ].join('|')
}

function eventSignature(event: SearchEvent) {
  return signature(
    {
      q: event.q,
      topic: (event.topic as SearchFilters['topic']) || '',
      author: event.author,
      from: event.from,
      to: event.to,
    },
    event.hits,
  )
}

function sameFilters(event: SearchEvent, filters: SearchFilters) {
  return (
    event.q.trim().toLowerCase() === filters.q.trim().toLowerCase() &&
    event.topic === (filters.topic || '') &&
    event.author === filters.author &&
    event.from === filters.from &&
    event.to === filters.to
  )
}

function loadLive(): AnalyticsEvent[] {
  if (memory) return memory
  if (typeof localStorage === 'undefined') {
    memory = []
    return memory
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : []
    memory = Array.isArray(parsed) ? parsed.filter((event) => event.source === 'live') : []
  } catch {
    memory = []
  }
  return memory
}

function persist(events: AnalyticsEvent[]) {
  memory = events.slice(-LIVE_CAP)
  if (typeof localStorage === 'undefined') {
    emit()
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    // Private mode and full disks still keep the in-memory ledger.
  }
  emit()
}

function stamp(daysAgo: number, hour: number, salt: number) {
  const at = new Date(ORIGIN)
  at.setUTCDate(at.getUTCDate() - daysAgo)
  at.setUTCHours(hour, (salt * 11) % 60, (salt * 3) % 60, 0)
  return at.toISOString()
}

function seedEvents(): AnalyticsEvent[] {
  if (seedCache) return seedCache
  seedCache = SEED_ASKS.flatMap((ask, index) => {
    const filters: SearchFilters = {
      ...EMPTY_FILTERS,
      q: ask.q ?? '',
      topic: ask.topic ?? '',
      author: ask.author ?? '',
      from: ask.from ?? '',
      to: ask.to ?? '',
    }
    const results = searchArticles(ARTICLES, filters)
    const at = stamp(ask.daysAgo, ask.hour, index)
    const searchId = `seed-s-${index}`
    const search: SearchEvent = {
      type: 'search',
      id: searchId,
      at,
      q: filters.q,
      topic: filters.topic,
      author: filters.author,
      from: filters.from,
      to: filters.to,
      hits: results.length,
      kind: kindOf(filters),
      heard: heardOf(filters),
      source: 'seed',
    }
    const clicked = ask.clickRank ? results[ask.clickRank - 1] : undefined
    if (!clicked || !ask.clickRank) return [search]
    const clickAt = new Date(Date.parse(at) + 95_000).toISOString()
    const click: ClickEvent = {
      type: 'click',
      id: `seed-c-${index}`,
      at: clickAt,
      searchId,
      slug: clicked.slug,
      rank: ask.clickRank,
      q: filters.q,
      source: 'seed',
    }
    return [search, click]
  })
  return seedCache
}

export function readEvents(): AnalyticsEvent[] {
  return [...seedEvents(), ...loadLive()].sort((a, b) => a.at.localeCompare(b.at))
}

function commitSearch(filters: SearchFilters, hits: number, at = new Date().toISOString()) {
  if (!isTrackedSearch(filters)) return null
  const live = loadLive()
  const last = [...live].reverse().find((event): event is SearchEvent => event.type === 'search')
  if (
    last &&
    eventSignature(last) === signature(filters, hits) &&
    Date.parse(at) - Date.parse(last.at) < DEDUPE_MS
  ) {
    return last
  }
  const event: SearchEvent = {
    type: 'search',
    id: `live-s-${Date.parse(at)}-${live.length}`,
    at,
    q: filters.q,
    topic: filters.topic,
    author: filters.author,
    from: filters.from,
    to: filters.to,
    hits,
    kind: kindOf(filters),
    heard: heardOf(filters),
    source: 'live',
  }
  persist([...live, event])
  return event
}

export function logSearchDebounced(filters: SearchFilters, hits: number, delay = 800) {
  if (pending) clearTimeout(pending.timer)
  if (!isTrackedSearch(filters)) {
    pending = null
    return
  }
  pending = {
    filters,
    hits,
    timer: setTimeout(() => {
      const next = pending
      pending = null
      if (next) commitSearch(next.filters, next.hits)
    }, delay),
  }
}

export function flushSearchLog() {
  if (!pending) return
  clearTimeout(pending.timer)
  const next = pending
  pending = null
  commitSearch(next.filters, next.hits)
}

export function logClick(slug: string, rank: number, filters: SearchFilters) {
  flushSearchLog()
  if (!isTrackedSearch(filters)) return
  const live = loadLive()
  const last = [...live].reverse().find((event): event is SearchEvent => event.type === 'search')
  const searchId =
    last && sameFilters(last, filters) ? last.id : (last?.id ?? `live-s-${Date.now()}`)
  const event: ClickEvent = {
    type: 'click',
    id: `live-c-${Date.now()}-${live.length}`,
    at: new Date().toISOString(),
    searchId,
    slug,
    rank,
    q: filters.q,
    source: 'live',
  }
  persist([...live, event])
}

export function clearLiveLedger() {
  if (pending) {
    clearTimeout(pending.timer)
    pending = null
  }
  persist([])
}

export function useSearchAnalytics(filters: SearchFilters, results: Article[]) {
  useEffect(() => {
    logSearchDebounced(filters, results.length)
  }, [filters, results.length])

  useEffect(() => () => flushSearchLog(), [])

  return {
    recordClick(article: Article, rank: number) {
      logClick(article.slug, rank, filters)
    },
  }
}

function lastDays(end: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(end)
    day.setUTCDate(day.getUTCDate() - (count - 1 - index))
    return day.toISOString().slice(0, 10)
  })
}

function rankedAsks(searches: SearchEvent[], clicks: ClickEvent[], predicate: (event: SearchEvent) => boolean) {
  const groups = new Map<string, RankedAsk>()
  for (const event of searches) {
    if (!predicate(event) || !event.q.trim()) continue
    const key = event.q.trim().toLowerCase()
    const current = groups.get(key) ?? { q: event.q.trim(), count: 0, hits: 0, clicks: 0 }
    current.count += 1
    current.hits += event.hits
    groups.set(key, current)
  }
  const clickCounts = new Map<string, number>()
  for (const event of clicks) {
    const key = event.q.trim().toLowerCase()
    if (!key) continue
    clickCounts.set(key, (clickCounts.get(key) ?? 0) + 1)
  }
  return [...groups.values()]
    .map((row) => ({
      ...row,
      hits: row.hits / row.count,
      clicks: clickCounts.get(row.q.toLowerCase()) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.q.localeCompare(b.q))
}

export function summarize(events = readEvents()): LedgerReport {
  const searches = events.filter((event): event is SearchEvent => event.type === 'search')
  const clicks = events.filter((event): event is ClickEvent => event.type === 'click')
  const clickedIds = new Set(clicks.map((event) => event.searchId))
  const zeros = searches.filter((event) => event.hits === 0).length
  const withQuery = searches.filter((event) => event.q.trim())
  const natural = searches.filter((event) => event.kind === 'natural').length
  const keyword = searches.filter((event) => event.kind === 'keyword').length
  const browse = searches.filter((event) => event.kind === 'browse').length
  const end = new Date(ORIGIN)

  const storyGroups = new Map<string, { count: number; rank: number }>()
  for (const event of clicks) {
    const current = storyGroups.get(event.slug) ?? { count: 0, rank: 0 }
    current.count += 1
    current.rank += event.rank
    storyGroups.set(event.slug, current)
  }

  const desks = new Map<string, number>()
  for (const event of searches) {
    const parsed = parseNaturalQuery(event.q)
    const desk = event.topic || parsed.topic
    if (!desk) continue
    desks.set(desk, (desks.get(desk) ?? 0) + 1)
  }

  const byDay = new Map<string, number>()
  for (const event of searches) {
    const day = event.at.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }

  return {
    searches: searches.length,
    liveSearches: searches.filter((event) => event.source === 'live').length,
    zeros,
    clicks: clicks.length,
    ctr: searches.length ? clickedIds.size / searches.length : 0,
    zeroRate: searches.length ? zeros / searches.length : 0,
    naturalShare: searches.length ? natural / searches.length : 0,
    keywordShare: searches.length ? keyword / searches.length : 0,
    browseShare: searches.length ? browse / searches.length : 0,
    topAsks: rankedAsks(withQuery, clicks, () => true).slice(0, 12),
    deadEnds: rankedAsks(
      withQuery,
      clicks,
      (event) => event.hits === 0,
    ).slice(0, 6),
    opened: [...storyGroups.entries()]
      .map(([slug, row]) => ({
        slug,
        title: ARTICLES.find((article) => article.slug === slug)?.title ?? slug,
        count: row.count,
        avgRank: row.rank / row.count,
      }))
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, 8),
    desks: [...desks.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    days: lastDays(end, 14).map((date) => ({ date, count: byDay.get(date) ?? 0 })),
    recent: [...searches].reverse().slice(0, 12),
  }
}

export function formatShare(value: number) {
  return `${Math.round(value * 100)}%`
}
