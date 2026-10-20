import { relatedTerms } from './concepts'
import type { ParsedQuery } from './nl'
import { contentTokens, effectiveFilters, parseNaturalQuery } from './nl'
import { semanticScore } from './tfidf'
import type { Article, SearchFilters, Topic } from '../types'
import { TOPICS } from '../types'
import { bestTokenMatch, bestTokenSimilarity, tokenize, variantsFor } from './fuzzy'

export const EMPTY_FILTERS: SearchFilters = {
  topic: '',
  author: '',
  from: '',
  to: '',
  q: '',
}

const TITLE_WEIGHT = 14
const META_WEIGHT = 8
const DEK_WEIGHT = 5
const LEAD_WEIGHT = 4
const BODY_WEIGHT = 1
const PHRASE_BONUS = 18
const SEMANTIC_WEIGHT = 55
const MIN_TOKEN_HIT = 0.55
const MIN_COSINE = 0.1
const DEK_DF_MAX = 0.2
const BODY_DF_MAX = 0.12

type IndexedArticle = {
  article: Article
  title: string[]
  dek: string[]
  meta: string[]
  lead: string[]
  body: string[]
  titlePhrase: string
}

type CorpusIndex = {
  indexed: IndexedArticle[]
  df: Map<string, number>
}

const corpusCache = new WeakMap<Article[], CorpusIndex>()

export function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value)
}

export function interpretQuery(raw: string): ParsedQuery {
  return parseNaturalQuery(raw)
}

function indexCorpus(articles: Article[]): CorpusIndex {
  const cached = corpusCache.get(articles)
  if (cached) return cached

  const indexed = articles.map((article) => ({
    article,
    title: tokenize(article.title),
    dek: tokenize(article.dek),
    meta: tokenize(`${article.author} ${article.topic} ${article.kicker}`),
    lead: tokenize(article.body[0] ?? ''),
    body: tokenize(article.body.slice(1).join(' ')),
    titlePhrase: tokenize(article.title).join(' '),
  }))

  const df = new Map<string, number>()
  for (const item of indexed) {
    const unique = new Set([
      ...item.title,
      ...item.dek,
      ...item.meta,
      ...item.lead,
      ...item.body,
    ])
    for (const token of unique) {
      df.set(token, (df.get(token) ?? 0) + 1)
    }
  }

  const next = { indexed, df }
  corpusCache.set(articles, next)
  return next
}

function passesStructuredFilters(article: Article, filters: SearchFilters) {
  if (filters.topic && article.topic !== filters.topic) return false
  if (filters.author && article.author !== filters.author) return false
  if (filters.from && article.date < filters.from) return false
  if (filters.to && article.date > filters.to) return false
  return true
}

function cappedHit(
  queryToken: string,
  fieldTokens: string[],
  df: Map<string, number>,
  corpusSize: number,
  maxDf: number,
) {
  const match = bestTokenMatch(queryToken, fieldTokens)
  if (match.score < MIN_TOKEN_HIT) return 0
  const fraction = (df.get(match.token) ?? corpusSize) / corpusSize
  return fraction <= maxDf ? match.score : 0
}

function expandedHit(
  token: string,
  field: (candidate: string) => number,
) {
  let best = field(token)
  const seed = variantsFor(token)[0]
  for (const related of relatedTerms(seed)) {
    if (related === token || related === seed) continue
    best = Math.max(best, field(related) * 0.86)
  }
  return best
}

function lexicalScore(
  item: IndexedArticle,
  tokens: string[],
  df: Map<string, number>,
  corpusSize: number,
  expand: boolean,
) {
  let score = 0
  let hits = 0
  const hit = expand
    ? expandedHit
    : (token: string, field: (candidate: string) => number) => field(token)

  for (const token of tokens) {
    const titleHit = hit(token, (candidate) => bestTokenSimilarity(candidate, item.title))
    const metaHit = hit(token, (candidate) => bestTokenSimilarity(candidate, item.meta))
    const dekHit = hit(token, (candidate) =>
      cappedHit(candidate, item.dek, df, corpusSize, DEK_DF_MAX),
    )
    const leadHit = hit(token, (candidate) =>
      cappedHit(candidate, item.lead, df, corpusSize, DEK_DF_MAX),
    )
    const bodyHit = hit(token, (candidate) =>
      cappedHit(candidate, item.body, df, corpusSize, BODY_DF_MAX),
    )
    const raw = Math.max(titleHit, metaHit, dekHit, leadHit, bodyHit)
    if (raw >= MIN_TOKEN_HIT) hits += 1

    score +=
      titleHit * TITLE_WEIGHT +
      metaHit * META_WEIGHT +
      dekHit * DEK_WEIGHT +
      leadHit * LEAD_WEIGHT +
      bodyHit * BODY_WEIGHT
  }

  if (tokens.length > 1 && item.titlePhrase.includes(tokens.join(' '))) {
    score += PHRASE_BONUS
  }

  return { score, hits }
}

export function searchArticles(articles: Article[], filters: SearchFilters) {
  const parsed = parseNaturalQuery(filters.q)
  const applied = effectiveFilters(filters, parsed)
  const tokens = contentTokens(parsed, filters.q)
  const candidates = articles.filter((article) => passesStructuredFilters(article, applied))

  if (tokens.length === 0) {
    return candidates.sort((a, b) => b.date.localeCompare(a.date))
  }

  const { indexed, df } = indexCorpus(articles)
  const bySlug = new Map(indexed.map((item) => [item.article.slug, item]))
  const scored: { article: Article; score: number }[] = []

  for (const article of candidates) {
    const item = bySlug.get(article.slug)
    if (!item) continue
    const lexical = lexicalScore(item, tokens, df, articles.length, parsed.natural)
    const meaning = semanticScore(articles, article.slug, tokens)
    const combined = lexical.score + meaning * SEMANTIC_WEIGHT
    const strongLexical = lexical.hits > 0 && lexical.score >= TITLE_WEIGHT * 0.7

    if (parsed.natural) {
      if (!strongLexical && meaning < MIN_COSINE) continue
    } else if (lexical.hits < tokens.length) {
      continue
    }

    scored.push({ article, score: combined })
  }

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.article.date.localeCompare(a.article.date)
    })
    .map((row) => row.article)
}

export function relatedArticles(articles: Article[], current: Article, limit = 4) {
  return articles
    .filter((article) => article.slug !== current.slug && article.topic === current.topic)
    .slice(0, limit)
}
