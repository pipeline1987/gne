import type { Article } from '../types'
import { EARLY_ARTICLES } from './archive-early'
import { LATE_ARTICLES } from './archive-late'

export const ARTICLES: Article[] = [...EARLY_ARTICLES, ...LATE_ARTICLES].sort((a, b) =>
  b.date.localeCompare(a.date),
)

export const ARCHIVE_START = '2006-10-31'
export const ARCHIVE_END = ARTICLES[0]?.date ?? '2026-10-20'

export function articleBySlug(slug: string) {
  return ARTICLES.find((article) => article.slug === slug)
}

export function articlesByAuthor(name: string) {
  return ARTICLES.filter((article) => article.author === name)
}

export function articlesByTopic(topic: string) {
  return ARTICLES.filter((article) => article.topic === topic)
}

export function featuredArticles(limit = 5) {
  return ARTICLES.filter((article) => article.featured).slice(0, limit)
}

export function latestArticles(limit = 8) {
  return ARTICLES.slice(0, limit)
}

export function yearsInArchive() {
  const years = new Set(ARTICLES.map((article) => Number(article.date.slice(0, 4))))
  return [...years].sort((a, b) => b - a)
}
