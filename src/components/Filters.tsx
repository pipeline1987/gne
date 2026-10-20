import type { FormEvent } from 'react'
import { activeChips, hasFacets } from '../lib/facets'
import type { SearchFilters } from '../types'

type Props = {
  value: SearchFilters
  onChange: (next: SearchFilters) => void
  onReset: () => void
}

export function Filters({ value, onChange, onReset }: Props) {
  const chips = activeChips(value)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
  }

  return (
    <form className="filters" onSubmit={handleSubmit} aria-label="Search the archive">
      <label className="field keyword-field">
        Keyword
        <input
          type="search"
          placeholder="pengiun, arkum, Vale…"
          value={value.q}
          onChange={(event) => onChange({ ...value, q: event.target.value })}
        />
      </label>
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
