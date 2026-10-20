import type { FormEvent } from 'react'
import { AUTHORS } from '../data/authors'
import { TOPICS, type SearchFilters } from '../types'

type Props = {
  value: SearchFilters
  onChange: (next: SearchFilters) => void
  onReset: () => void
}

export function Filters({ value, onChange, onReset }: Props) {
  function update<K extends keyof SearchFilters>(key: K, next: SearchFilters[K]) {
    onChange({ ...value, [key]: next })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
  }

  return (
    <form className="filters" onSubmit={handleSubmit} aria-label="Search the archive">
      <h2>Search twenty years of the night</h2>
      <div className="filters-grid">
        <label className="field">
          Keyword
          <input
            type="search"
            placeholder="pengiun, arkum, Vale…"
            value={value.q}
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <label className="field">
          Topic
          <select
            value={value.topic}
            onChange={(event) =>
              update('topic', event.target.value as SearchFilters['topic'])
            }
          >
            <option value="">All desks</option>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Author
          <select value={value.author} onChange={(event) => update('author', event.target.value)}>
            <option value="">All bylines</option>
            {AUTHORS.map((author) => (
              <option key={author.slug} value={author.name}>
                {author.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          From
          <input
            type="date"
            min="2006-10-31"
            max="2026-10-20"
            value={value.from}
            onChange={(event) => update('from', event.target.value)}
          />
        </label>
        <label className="field">
          To
          <input
            type="date"
            min="2006-10-31"
            max="2026-10-20"
            value={value.to}
            onChange={(event) => update('to', event.target.value)}
          />
        </label>
        <label className="field">
          &nbsp;
          <button type="button" onClick={onReset}>
            Clear
          </button>
        </label>
      </div>
    </form>
  )
}
