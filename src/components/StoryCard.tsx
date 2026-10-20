import { Link } from 'react-router-dom'
import { formatShortDate } from '../lib/format'
import type { Article } from '../types'

type Props = {
  article: Article
}

export function StoryCard({ article }: Props) {
  return (
    <article className="story">
      <Link to={`/article/${article.slug}`}>
        <div className="kicker">{article.kicker}</div>
        <h3>{article.title}</h3>
        <p>{article.dek}</p>
        <div className="byline">
          {article.author} · {formatShortDate(article.date)}
        </div>
      </Link>
    </article>
  )
}
