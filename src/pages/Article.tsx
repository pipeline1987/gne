import { Link, useParams } from 'react-router-dom'
import { articleBySlug, ARTICLES } from '../data/articles'
import { authorByName } from '../data/authors'
import { formatDate, topicSlug } from '../lib/format'
import { relatedArticles } from '../lib/search'

export function ArticlePage() {
  const { slug } = useParams()
  const article = slug ? articleBySlug(slug) : undefined

  if (!article) {
    return (
      <p className="empty">
        That slug is not in the basement. Return to the <Link to="/archive">archive</Link>.
      </p>
    )
  }

  const author = authorByName(article.author)
  const related = relatedArticles(ARTICLES, article)

  return (
    <div className="article-page">
      <article className="paper">
        <div className="kicker">{article.kicker}</div>
        <h1>{article.title}</h1>
        <p className="dek">{article.dek}</p>
        <div className="byline">
          {author ? (
            <Link to={`/author/${author.slug}`}>{article.author}</Link>
          ) : (
            article.author
          )}
          {' · '}
          <Link to={`/topic/${topicSlug(article.topic)}`}>{article.topic}</Link>
          {' · '}
          {formatDate(article.date)}
        </div>
        {article.body.map((paragraph, index) => (
          <p key={index} className={index === 0 ? 'drop' : undefined}>
            {paragraph}
          </p>
        ))}
      </article>
      <aside className="rail related">
        <h3>Same desk</h3>
        <ul className="rail-list">
          {related.map((item) => (
            <li key={item.slug}>
              <Link to={`/article/${item.slug}`}>
                <strong>{item.title}</strong>
                <span className="byline">{formatDate(item.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link to={`/archive?topic=${article.topic}`}>More {article.topic} copy</Link>
        </p>
      </aside>
    </div>
  )
}
