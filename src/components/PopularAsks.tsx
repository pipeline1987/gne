import { Link } from 'react-router-dom'
import { summarize } from '../lib/analytics'

export function PopularAsks({
  limit = 6,
  lead = 'Night desk often asks',
}: {
  limit?: number
  lead?: string
}) {
  const asks = summarize()
    .topAsks.filter((ask) => ask.hits > 0)
    .slice(0, limit)
  if (asks.length === 0) return null

  return (
    <p className="popular-asks">
      {lead ? `${lead} ` : null}
      {asks.map((ask, index) => (
        <span key={ask.q}>
          {index > 0 ? ' · ' : ''}
          <Link to={`/archive?q=${encodeURIComponent(ask.q)}`}>{ask.q}</Link>
        </span>
      ))}
    </p>
  )
}
