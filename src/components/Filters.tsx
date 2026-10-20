import type { FormEvent } from 'react'
import { activeChips, hasFacets } from '../lib/facets'
import { interpretQuery } from '../lib/search'
import type { SearchFilters } from '../types'

type Props = {
  value: SearchFilters
  onChange: (next: SearchFilters) => void
  onReset: () => void
}

export function Filters({ value, onChange, onReset }: Props) {
  const chips = activeChips(value)
  const parsed = interpretQuery(value.q)
  const heard = [
    ...parsed.heard,
    parsed.natural && parsed.content ? parsed.content : '',
  ].filter(Boolean)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
  }

  return (
    <form className="filters" onSubmit={handleSubmit} aria-label="Search the archive">
      <label className="field keyword-field">
        Ask the archive
        <input
          type="search"
          placeholder="What's going on at the asylum?"
          value={value.q}
          onChange={(event) => onChange({ ...value, q: event.target.value })}
        />
      </label>
      <p className="search-hint">
        Try a sentence: “Who owns the Iceberg Lounge?” · “Vale on the penguin in 2018.”
      </p>
      {heard.length > 0 && (
        <p className="heard">Heard as {heard.join(' · ')}</p>
      )}
      {chips.length > 0 && (
        <div className="active-chips" aria-label="Active filters">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="chip active"
              onClick={() => onChange(chip.next)}
            >
              {chip.label} ×
            </button>
          ))}
          {hasFacets(value) && (
            <button type="button" className="chip" onClick={onReset}>
              Clear all
            </button>
          )}
        </div>
      )}
    </form>
  )
}
