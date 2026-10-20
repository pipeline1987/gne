import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { STARTER_ASKS } from '../lib/desk'
import { answerDesk, clearDeskThread, postUserAsk, readDeskThread, subscribeDesk } from '../lib/desk-session'
import { formatDate } from '../lib/format'

type Props = {
  compact?: boolean
}

export function DeskChat({ compact = false }: Props) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)
  const thread = readDeskThread()

  useEffect(() => subscribeDesk(() => setTick((value) => value + 1)), [])
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [tick, thread.length, busy])

  function send(text: string) {
    const next = text.trim()
    if (!next || busy) return
    setDraft('')
    postUserAsk(next)
    setBusy(true)
    window.setTimeout(() => {
      answerDesk(next)
      setBusy(false)
    }, 280)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send(draft)
  }

  return (
    <div className={compact ? 'desk-chat compact' : 'desk-chat'}>
      <div className="desk-thread" aria-live="polite">
        {thread.length === 0 && (
          <div className="desk-empty">
            <p>
              Night desk. I read the basement — not the wire, not the rumor. Ask a sentence. I will
              search the morgue, pull a piece, and answer from the copy.
            </p>
            <div className="desk-starters" aria-label="Starter asks">
              {STARTER_ASKS.map((ask) => (
                <button key={ask} type="button" className="chip" onClick={() => send(ask)}>
                  {ask}
                </button>
              ))}
            </div>
          </div>
        )}

        {thread.map((message) => (
          <article key={message.id} className={`desk-msg ${message.role}`}>
            <div className="desk-who">{message.role === 'user' ? 'You' : 'Night desk'}</div>
            {message.traces && message.traces.length > 0 && (
              <ol className="desk-traces">
                {message.traces.map((trace) => (
                  <li key={trace.label}>{trace.label}</li>
                ))}
              </ol>
            )}
            <p>{message.text}</p>
            {message.citations && message.citations.length > 0 && (
              <ul className="desk-cites">
                {message.citations.map((citation) => (
                  <li key={citation.slug}>
                    <Link to={`/article/${citation.slug}`}>
                      <strong>{citation.title}</strong>
                      <span className="byline">
                        {citation.author}
                        {citation.date ? ` · ${formatDate(citation.date)}` : ''}
                      </span>
                    </Link>
                    {citation.dek ? <span className="dek">{citation.dek}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            {message.archiveHref && (
              <p className="desk-more">
                <Link to={message.archiveHref}>Open the folder</Link>
              </p>
            )}
            {message.followUps && message.followUps.length > 0 && (
              <div className="desk-starters">
                {message.followUps.map((ask) => (
                  <button key={ask} type="button" className="chip" onClick={() => send(ask)}>
                    {ask}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}

        {busy && (
          <article className="desk-msg desk">
            <div className="desk-who">Night desk</div>
            <p className="desk-wait">Checking the morgue…</p>
          </article>
        )}
        <div ref={endRef} />
      </div>

      <form className="desk-composer" onSubmit={handleSubmit}>
        <label className="field keyword-field">
          Ask the night desk
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What's happening at the asylum?"
            autoComplete="off"
            disabled={busy}
          />
        </label>
        <div className="desk-actions">
          <button type="submit" className="chip active" disabled={busy || !draft.trim()}>
            File it
          </button>
          {thread.length > 0 && (
            <button type="button" className="chip" onClick={clearDeskThread}>
              Clear the spike
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
