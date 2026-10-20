import type { Article, SearchFilters, Topic } from '../types'
import { TOPICS } from '../types'
import { bestTokenMatch, bestTokenSimilarity, queryTokens, tokenize } from './fuzzy'

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
const MIN_TOKEN_HIT = 0.55
/** Mentions of very common words ("night", "gotham") are noise outside the headline. */
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

function articleScore(
  item: IndexedArticle,
  tokens: string[],
  df: Map<string, number>,
  corpusSize: number,
) {
  let score = 0

  for (const token of tokens) {
    const titleHit = bestTokenSimilarity(token, item.title)
    const metaHit = bestTokenSimilarity(token, item.meta)
    const dekHit = cappedHit(token, item.dek, df, corpusSize, DEK_DF_MAX)
    const leadHit = cappedHit(token, item.lead, df, corpusSize, DEK_DF_MAX)
    const bodyHit = cappedHit(token, item.body, df, corpusSize, BODY_DF_MAX)
    const raw = Math.max(titleHit, metaHit, dekHit, leadHit, bodyHit)
    if (raw < MIN_TOKEN_HIT) return 0

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

  return score
}

export function searchArticles(articles: Article[], filters: SearchFilters) {
  const tokens = queryTokens(filters.q)

  if (tokens.length === 0) {
    return articles
      .filter((article) => passesStructuredFilters(article, filters))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  const { indexed, df } = indexCorpus(articles)
  const scored: { article: Article; score: number }[] = []

  for (const item of indexed) {
    if (!passesStructuredFilters(item.article, filters)) continue
    const score = articleScore(item, tokens, df, articles.length)
    if (score <= 0) continue
    scored.push({ article: item.article, score })
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
