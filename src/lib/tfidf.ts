import type { Article } from '../types'
import { expandQueryTerms } from './concepts'
import { tokenize, variantsFor } from './fuzzy'

type Sparse = Map<string, number>

type SemanticIndex = {
  vectors: Map<string, Sparse>
  idf: Map<string, number>
}

const cache = new WeakMap<Article[], SemanticIndex>()

function addTerms(target: Map<string, number>, tokens: string[], weight: number) {
  for (const token of tokens) {
    const term = variantsFor(token)[0]
    target.set(term, (target.get(term) ?? 0) + weight)
  }
}

function l2(vector: Sparse) {
  let sum = 0
  for (const value of vector.values()) sum += value * value
  return Math.sqrt(sum) || 1
}

function toTfidf(tf: Sparse, idf: Map<string, number>): Sparse {
  const vector: Sparse = new Map()
  for (const [term, count] of tf) {
    vector.set(term, count * (idf.get(term) ?? 0))
  }
  const norm = l2(vector)
  for (const [term, value] of vector) vector.set(term, value / norm)
  return vector
}

export function semanticIndex(articles: Article[]): SemanticIndex {
  const cached = cache.get(articles)
  if (cached) return cached

  const tfs: { slug: string; tf: Sparse }[] = []
  const df = new Map<string, number>()

  for (const article of articles) {
    const tf: Sparse = new Map()
    addTerms(tf, tokenize(article.title), 5)
    addTerms(tf, tokenize(article.dek), 3)
    addTerms(tf, tokenize(`${article.author} ${article.topic} ${article.kicker}`), 2)
    addTerms(tf, tokenize(article.body.join(' ')), 1)
    tfs.push({ slug: article.slug, tf })
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1)
  }

  const n = articles.length
  const idf = new Map<string, number>()
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1)
  }

  const vectors = new Map<string, Sparse>()
  for (const row of tfs) {
    vectors.set(row.slug, toTfidf(row.tf, idf))
  }

  const next = { vectors, idf }
  cache.set(articles, next)
  return next
}

export function queryVector(tokens: string[], idf: Map<string, number>): Sparse {
  const tf: Sparse = new Map()
  for (const token of tokens) {
    const canonical = variantsFor(token)[0]
    tf.set(canonical, (tf.get(canonical) ?? 0) + 1)
  }
  for (const related of expandQueryTerms(tokens)) {
    if (!tf.has(related)) tf.set(related, 0.65)
  }
  return toTfidf(tf, idf)
}

export function cosine(a: Sparse, b: Sparse) {
  if (a.size === 0 || b.size === 0) return 0
  const [shorter, longer] = a.size < b.size ? [a, b] : [b, a]
  let dot = 0
  for (const [term, value] of shorter) {
    const other = longer.get(term)
    if (other) dot += value * other
  }
  return dot
}

export function semanticScore(articles: Article[], slug: string, tokens: string[]) {
  if (tokens.length === 0) return 0
  const index = semanticIndex(articles)
  const document = index.vectors.get(slug)
  if (!document) return 0
  return cosine(queryVector(tokens, index.idf), document)
}
