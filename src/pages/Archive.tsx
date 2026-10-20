import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Facets } from '../components/Facets'
import { Filters } from '../components/Filters'
import { PopularAsks } from '../components/PopularAsks'
import { ARTICLES } from '../data/articles'
import { useSearchAnalytics } from '../lib/analytics'
import { buildFacets } from '../lib/facets'
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
  const queryKey = params.toString()
  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(queryKey)),
    [queryKey],
  )
  const results = useMemo(() => searchArticles(ARTICLES, filters), [filters])
  const facets = useMemo(() => buildFacets(ARTICLES, filters), [filters])
  const analytics = useSearchAnalytics(filters, results)

  function setFilters(next: SearchFilters) {
    setParams(paramsFromFilters(next), { replace: true })
  }

  return (
    <>
      <div className="archive-head">
        <div>
          <h1>The archive</h1>
          <p className="lede">
            Twenty years of Gotham after dark. Ask in plain English, or filter by desk, decade, year,
            and byline.
          </p>
        </div>
        <div className="count">
          {results.length} {results.length === 1 ? 'piece' : 'pieces'}
          {filters.q.trim() ? ' · closest first' : ''}
        </div>
      </div>

      <Filters value={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />
      <PopularAsks />

      <div className="archive-shell">
        <Facets
          filters={filters}
          desks={facets.desks}
          decades={facets.decades}
          years={facets.years}
          bylines={facets.bylines}
          deskTotal={facets.deskTotal}
          dateTotal={facets.dateTotal}
          bylineTotal={facets.bylineTotal}
          onChange={setFilters}
        />

        <div className="archive-results">
          {results.length === 0 ? (
            <p className="empty">
              No copy close enough. Clear a facet, try another spelling, or widen the years.
            </p>
          ) : (
            results.map((article, index) => (
              <article className="listing" key={article.slug}>
                <time dateTime={article.date}>{formatDate(article.date)}</time>
                <div>
                  <div className="kicker">{article.topic}</div>
                  <Link
                    to={`/article/${article.slug}`}
                    onClick={() => analytics.recordClick(article, index + 1)}
                  >
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
        </div>
      </div>
    </>
  )
}
