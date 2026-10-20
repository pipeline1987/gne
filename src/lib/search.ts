import type { Article, SearchFilters, Topic } from '../types'
import { TOPICS } from '../types'

export const EMPTY_FILTERS: SearchFilters = {
  topic: '',
  author: '',
  from: '',
  to: '',
  q: '',
}

export function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value)
}

export function searchArticles(articles: Article[], filters: SearchFilters) {
  const query = filters.q.trim().toLowerCase()

  return articles
    .filter((article) => {
      if (filters.topic && article.topic !== filters.topic) return false
      if (filters.author && article.author !== filters.author) return false
      if (filters.from && article.date < filters.from) return false
      if (filters.to && article.date > filters.to) return false
      if (query) {
        const haystack = [
          article.title,
          article.dek,
          article.kicker,
          article.author,
          article.topic,
          ...article.body,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function relatedArticles(articles: Article[], current: Article, limit = 4) {
  return articles
    .filter((article) => article.slug !== current.slug && article.topic === current.topic)
    .slice(0, limit)
}
