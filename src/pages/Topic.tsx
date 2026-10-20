import { Link, useParams } from 'react-router-dom'
import { articlesByTopic } from '../data/articles'
import { displayTopic, formatDate } from '../lib/format'
import { isTopic } from '../lib/search'

export function TopicPage() {
  const { slug } = useParams()
  const topicName = slug ? displayTopic(slug) : ''
  const topic = isTopic(topicName) ? topicName : undefined
  const articles = topic ? articlesByTopic(topic) : []

  if (!topic) {
    return (
      <p className="empty">
        No such desk. Return to the <Link to="/archive">archive</Link>.
      </p>
    )
  }

  return (
    <>
      <div className="archive-head">
        <div>
          <div className="kicker">Desk</div>
          <h1>{topic}</h1>
          <p className="lede">
            Copy from the {topic} desk, newest first. Narrow by date in the{' '}
            <Link to={`/archive?topic=${topic}`}>archive search</Link>.
          </p>
        </div>
        <div className="count">
          {articles.length} {articles.length === 1 ? 'piece' : 'pieces'}
        </div>
      </div>
      {articles.map((article) => (
        <article className="listing" key={article.slug}>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <div>
            <div className="kicker">{article.kicker}</div>
            <Link to={`/article/${article.slug}`}>
              <h2>{article.title}</h2>
            </Link>
            <p className="dek">{article.dek}</p>
            <div className="byline">{article.author}</div>
          </div>
        </article>
      ))}
    </>
  )
}
