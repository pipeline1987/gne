import { Link } from 'react-router-dom'
import { AUTHORS } from '../data/authors'
import { ARTICLES } from '../data/articles'

export function About() {
  return (
    <div className="about">
      <div className="kicker">The newsroom</div>
      <h1>A startup that stayed up</h1>
      <p>
        Gotham Night Edition began on Halloween 2006 as a late-shift digital desk of twelve,
        printing from a Tricorner press bay that still smelled like the river. The charter was
        narrow: cover the city after the hearings adjourned. Twenty years later the staff is still
        small, the tip line still rings after dark, and the basement is an archive you can search
        by topic, author, and date. The night desk keeps a search ledger for the questions that
        found copy, the ones that died in the stacks, and the pieces readers actually opened.{' '}
        <Link to="/ledger">Read the ledger</Link>. After dark you can also{' '}
        <Link to="/desk">ask the night clerk</Link> — it only answers from the basement.
      </p>
      <p>
        We are a startup in the only sense that matters in this town — we never got large enough to
        forget the night. {ARTICLES.length} pieces. Ten bylines. Six desks. One masthead that
        refuses daylight.
      </p>
      <div className="section-head">
        <h2>Bylines</h2>
      </div>
      <ul className="rail-list">
        {AUTHORS.map((author) => (
          <li key={author.slug}>
            <Link to={`/author/${author.slug}`}>
              <strong>{author.name}</strong>
              <span className="byline">{author.title}</span>
            </Link>
            <p>{author.bio}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
