import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filters } from '../components/Filters'
import { ARTICLES, yearsInArchive } from '../data/articles'
import { formatDate } from '../lib/format'
import { EMPTY_FILTERS, isTopic, searchArticles } from '../lib/search'
import type { SearchFilters } from '../types'

function filtersFromParams(params: URLSearchParams): SearchFilters {
  const topicValue = params.get('topic') ?? ''
  return {
    q: params.get('q') ?? '',
    topic: isTopic(topicValue) ? topicValue : '',
    author: params.get('author') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  }
}

function paramsFromFilters(filters: SearchFilters) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.topic) params.set('topic', filters.topic)
  if (filters.author) params.set('author', filters.author)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  return params
}

export function Archive() {
  const [params, setParams] = useSearchParams()
  const filters = filtersFromParams(params)
  const results = useMemo(() => searchArticles(ARTICLES, filters), [filters])
  const years = yearsInArchive()

  function setFilters(next: SearchFilters) {
    setParams(paramsFromFilters(next), { replace: true })
  }

  const fromYear = filters.from.slice(0, 4)
  const activeYear =
    filters.from.endsWith('-01-01') &&
    filters.to.endsWith('-12-31') &&
    fromYear === filters.to.slice(0, 4)
      ? fromYear
      : ''

  return (
    <>
      <div className="archive-head">
        <div>
          <h1>The archive</h1>
          <p className="lede">
            Twenty years of Gotham after dark. Search by topic, author, and date — misspellings
            still land on the closest copy.
          </p>
        </div>
        <div className="count">
          {results.length} {results.length === 1 ? 'piece' : 'pieces'}
          {filters.q.trim() ? ' · closest first' : ''}
        </div>
      </div>

      <Filters value={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

      <div className="years" aria-label="Jump to year">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            className={activeYear === String(year) ? 'chip active' : 'chip'}
            onClick={() =>
              setFilters({
                ...filters,
                from: `${year}-01-01`,
                to: `${year}-12-31`,
              })
            }
          >
            {year}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="empty">
          No copy close enough. Try another spelling, a desk, a byline, or a wider year.
        </p>
      ) : (
        results.map((article) => (
          <article className="listing" key={article.slug}>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            <div>
              <div className="kicker">{article.topic}</div>
              <Link to={`/article/${article.slug}`}>
                <h2>{article.title}</h2>
              </Link>
              <p className="dek">{article.dek}</p>
              <div className="byline">
                {article.author} · {article.kicker}
              </div>
            </div>
          </article>
        ))
      )}
    </>
  )
}
