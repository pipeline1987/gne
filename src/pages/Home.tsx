import { Link } from 'react-router-dom'
import { PopularAsks } from '../components/PopularAsks'
import { Skyline } from '../components/Skyline'
import { StoryCard } from '../components/StoryCard'
import { Ticker } from '../components/Ticker'
import { ARTICLES, yearsInArchive } from '../data/articles'
import { formatDate } from '../lib/format'
import { authorByName } from '../data/authors'

const CLASSIFIEDS = [
  'LOST: black umbrella, Iceberg Lounge. Do not return. — O.',
  'WANTED: overnight accountant. Must not ask about the other ledger.',
  'BAT-SIGNAL: not a job listing. GCPD public affairs.',
  'FOR SALE: floodwall sandbags, barely used, 2006 vintage.',
  'FOUND: chess piece on precinct steps. Owner knows the question.',
  'HELP WANTED: clinic chairs. Bring your own. Narrows side of the wall.',
]

export function Home() {
  const [lead, ...rest] = ARTICLES
  const rail = rest.slice(0, 5)
  const desk = rest.slice(5, 11)
  const archiveYears = yearsInArchive()
  const throwback = ARTICLES.findLast((article) => article.date.startsWith('2006'))

  return (
    <>
      <Ticker articles={ARTICLES} />
      <section className="hero">
        <article className="hero-story">
          <div className="kicker">{lead.kicker} · {formatDate(lead.date)}</div>
          <Link to={`/article/${lead.slug}`}>
            <h2>{lead.title}</h2>
            <p className="dek">{lead.dek}</p>
          </Link>
          <p>{lead.body[0]}</p>
          <div className="byline">
            By <Link to={`/author/${authorByName(lead.author)?.slug}`}>{lead.author}</Link>
          </div>
        </article>
        <aside className="rail">
          <h3>Night weather</h3>
          <Skyline />
          <p className="weather">Fog. Always fog. High 48. The Signal is on the roof. Crime Alley’s bulb is not.</p>
          <h3>Latest copy</h3>
          <ul className="rail-list">
            {rail.map((article) => (
              <li key={article.slug}>
                <Link to={`/article/${article.slug}`}>
                  <strong>{article.title}</strong>
                  <span className="byline">
                    {article.author} · {article.topic}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <div className="section-head">
        <h2>From the desks</h2>
        <Link to="/archive">Search the archive</Link>
      </div>
      <div className="grid-3">
        {desk.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>

      {throwback && (
        <>
          <div className="section-head">
            <h2>From the first edition</h2>
            <Link to="/archive?from=2006-10-31&to=2006-12-31">2006</Link>
          </div>
          <StoryCard article={throwback} />
        </>
      )}

      <div className="section-head">
        <h2>Twenty years</h2>
        <span>2006 — 2026</span>
      </div>
      <div className="years">
        {archiveYears.map((year) => (
          <Link key={year} to={`/archive?from=${year}-01-01&to=${year}-12-31`}>
            {year}
          </Link>
        ))}
      </div>

      <section className="classifieds">
        <h2>What the city asked</h2>
        <PopularAsks limit={8} lead="" />
        <p className="weather">
          <Link to="/desk">Ask the night desk</Link> — or{' '}
          <Link to="/ledger">open the search ledger</Link> for dead ends and the copy people opened.
        </p>
      </section>

      <section className="classifieds">
        <h2>Night classifieds</h2>
        <ul>
          {CLASSIFIEDS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </>
  )
}
