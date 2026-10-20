import { Link, useParams } from 'react-router-dom'
import { authorBySlug } from '../data/authors'
import { articlesByAuthor } from '../data/articles'
import { formatDate } from '../lib/format'

export function AuthorPage() {
  const { slug } = useParams()
  const author = slug ? authorBySlug(slug) : undefined
  const articles = author ? articlesByAuthor(author.name) : []

  if (!author) {
    return (
      <p className="empty">
        No such byline. See the <Link to="/about">newsroom</Link>.
      </p>
    )
  }

  return (
    <>
      <div className="archive-head">
        <div>
          <div className="kicker">{author.title}</div>
          <h1>{author.name}</h1>
          <p className="lede">{author.bio}</p>
        </div>
        <div className="count">
          {articles.length} {articles.length === 1 ? 'piece' : 'pieces'}
        </div>
      </div>
      {articles.map((article) => (
        <article className="listing" key={article.slug}>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <div>
            <div className="kicker">{article.topic}</div>
            <Link to={`/article/${article.slug}`}>
              <h2>{article.title}</h2>
            </Link>
            <p className="dek">{article.dek}</p>
          </div>
        </article>
      ))}
    </>
  )
}
