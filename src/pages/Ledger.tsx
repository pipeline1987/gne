import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  clearLiveLedger,
  formatShare,
  subscribeLedger,
  summarize,
  type DayVolume,
  type RankedAsk,
} from '../lib/analytics'
import { formatClock, formatShortDate } from '../lib/format'

function askHref(ask: RankedAsk) {
  return `/archive?q=${encodeURIComponent(ask.q)}`
}

function VolumeChart({ days }: { days: DayVolume[] }) {
  const max = Math.max(...days.map((day) => day.count), 1)
  return (
    <ol className="volume" aria-label="Asks per night, last fourteen days">
      {days.map((day) => (
        <li key={day.date}>
          <span
            className="volume-bar"
            style={{ height: `${Math.max((day.count / max) * 100, day.count ? 8 : 0)}%` }}
            title={`${formatShortDate(day.date)}: ${day.count}`}
          />
          <span className="volume-label">{day.date.slice(8)}</span>
        </li>
      ))}
    </ol>
  )
}

function AskRows({
  rows,
  empty,
  extra,
}: {
  rows: RankedAsk[]
  empty: string
  extra: (row: RankedAsk) => string
}) {
  if (rows.length === 0) return <p className="empty">{empty}</p>
  const max = Math.max(...rows.map((row) => row.count), 1)
  return (
    <ol className="ask-rows">
      {rows.map((row) => (
        <li key={row.q}>
          <Link to={askHref(row)}>{row.q}</Link>
          <span className="ask-meta">
            {row.count} · {extra(row)}
          </span>
          <span className="ask-track" aria-hidden="true">
            <span className="ask-fill" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  )
}

export function Ledger() {
  const [tick, setTick] = useState(0)
  useEffect(() => subscribeLedger(() => setTick((value) => value + 1)), [])
  const report = useMemo(() => summarize(), [tick])

  return (
    <div className="ledger">
      <div className="archive-head">
        <div>
          <div className="kicker">Night desk counts</div>
          <h1>The search ledger</h1>
          <p className="lede">
            What the city asked after dark — sample night-desk traffic plus every search from this
            browser. Nothing leaves the machine.
          </p>
        </div>
        <div className="count">
          {report.searches} asks · {report.liveSearches} from this browser
        </div>
      </div>

      <div className="stats-strip" role="list" aria-label="Search totals">
        <div className="stat" role="listitem">
          <b>{report.searches}</b>
          <span>Asks logged</span>
        </div>
        <div className="stat" role="listitem">
          <b>{formatShare(report.zeroRate)}</b>
          <span>Dead ends</span>
        </div>
        <div className="stat" role="listitem">
          <b>{formatShare(report.ctr)}</b>
          <span>Followed a piece</span>
        </div>
        <div className="stat" role="listitem">
          <b>{formatShare(report.naturalShare)}</b>
          <span>In sentences</span>
        </div>
      </div>

      <section className="ledger-panel">
        <div className="section-head">
          <h2>Volume this fortnight</h2>
          <span>
            {formatShare(report.keywordShare)} keywords · {formatShare(report.browseShare)} desks
          </span>
        </div>
        <VolumeChart days={report.days} />
      </section>

      <div className="ledger-grid">
        <section className="ledger-panel">
          <div className="section-head">
            <h2>What they asked</h2>
            <span>Most repeated</span>
          </div>
          <AskRows
            rows={report.topAsks.slice(0, 8)}
            empty="No asks yet. Try the archive."
            extra={(row) => `${Math.round(row.hits)} hits`}
          />
        </section>
        <section className="ledger-panel">
          <div className="section-head">
            <h2>Dead ends</h2>
            <span>Zero copy</span>
          </div>
          <AskRows
            rows={report.deadEnds}
            empty="No empty asks in the log."
            extra={() => 'no hits'}
          />
        </section>
        <section className="ledger-panel">
          <div className="section-head">
            <h2>Copy they opened</h2>
            <span>From a search</span>
          </div>
          {report.opened.length === 0 ? (
            <p className="empty">Nobody followed a result yet.</p>
          ) : (
            <ol className="ask-rows">
              {report.opened.map((row) => (
                <li key={row.slug}>
                  <Link to={`/article/${row.slug}`}>{row.title}</Link>
                  <span className="ask-meta">
                    {row.count} · avg rank {row.avgRank.toFixed(1)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {report.desks.length > 0 && (
        <section className="ledger-panel">
          <div className="section-head">
            <h2>Desks they meant</h2>
            <span>Heard or filtered</span>
          </div>
          <ul className="desk-pills">
            {report.desks.map((desk) => (
              <li key={desk.label}>
                <Link to={`/archive?topic=${encodeURIComponent(desk.label)}`}>
                  {desk.label} · {desk.count}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ledger-panel">
        <div className="section-head">
          <h2>Recent asks</h2>
          <span>Newest first</span>
        </div>
        <table className="ledger-table">
          <caption className="sr-only">Recent archive searches</caption>
          <thead>
            <tr>
              <th>When</th>
              <th>Ask</th>
              <th>Heard as</th>
              <th>Kind</th>
              <th>Hits</th>
            </tr>
          </thead>
          <tbody>
            {report.recent.map((event) => (
              <tr key={event.id}>
                <td>{formatClock(event.at)}</td>
                <td>
                  {event.q.trim() ? (
                    <Link to={`/archive?q=${encodeURIComponent(event.q)}`}>{event.q}</Link>
                  ) : (
                    <span className="muted">
                      {event.topic || event.author || 'desk browse'}
                    </span>
                  )}
                </td>
                <td>{event.heard || '—'}</td>
                <td className="kind">{event.kind}</td>
                <td>{event.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="ledger-note">
        Sample traffic is invented night-desk copy so the board is readable on a first visit. Your
        own asks stay in this browser.{' '}
        {report.liveSearches > 0 && (
          <button type="button" className="chip" onClick={clearLiveLedger}>
            Clear this browser
          </button>
        )}
      </p>
    </div>
  )
}
