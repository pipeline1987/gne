import { NavLink, Outlet } from 'react-router-dom'
import { topicSlug } from '../lib/format'
import { TOPICS } from '../types'

const today = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date('2026-10-20T12:00:00Z'))

export function Layout() {
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to late city run
      </a>
      <header className="masthead">
        <div className="wrap">
          <div className="masthead-meta">
            <span>Vol. XXI · No. 294 · Late city</span>
            <span>{today}</span>
            <span>Still free. For now.</span>
          </div>
          <NavLink to="/" className="brand">
            <div className="brand-kicker">Est. 2006 · Tricorner press bay</div>
            <h1>Gotham Night Edition</h1>
            <blockquote>“News from the city that never sleeps — and shouldn’t.”</blockquote>
          </NavLink>
          <nav className="nav" aria-label="Sections">
            <NavLink to="/" end>
              Late city
            </NavLink>
            {TOPICS.map((topic) => (
              <NavLink key={topic} to={`/topic/${topicSlug(topic)}`}>
                {topic}
              </NavLink>
            ))}
            <NavLink to="/archive">Archive</NavLink>
            <NavLink to="/about">Newsroom</NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="page">
        <div className="wrap">
          <Outlet />
        </div>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <span>Gotham Night Edition · Night desk since October 31, 2006</span>
          <span>Tip line answered after dark. Search the night by topic, author, or date.</span>
        </div>
      </footer>
    </div>
  )
}
