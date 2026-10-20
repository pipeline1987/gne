import { Link } from 'react-router-dom'
import type { Article } from '../types'

type Props = {
  articles: Article[]
}

export function Ticker({ articles }: Props) {
  const items = articles.slice(0, 6)
  const loop = [...items, ...items]

  return (
    <div className="ticker" aria-label="Breaking copy">
      <div className="ticker-track">
        {loop.map((article, index) => (
          <Link key={`${article.slug}-${index}`} to={`/article/${article.slug}`}>
            <b>Night desk</b>
            {article.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
