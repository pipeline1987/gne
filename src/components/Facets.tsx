import {
  DECADES,
  selectedPreset,
  yearPreset,
  type FacetBucket,
} from '../lib/facets'
import { isTopic } from '../lib/search'
import type { SearchFilters } from '../types'

type Props = {
  filters: SearchFilters
  desks: FacetBucket[]
  decades: FacetBucket[]
  years: FacetBucket[]
  bylines: FacetBucket[]
  deskTotal: number
  dateTotal: number
  bylineTotal: number
  onChange: (next: SearchFilters) => void
}

function FacetList({
  legend,
  allLabel,
  allCount,
  buckets,
  selected,
  onSelect,
  onClear,
  scroll,
}: {
  legend: string
  allLabel: string
  allCount: number
  buckets: FacetBucket[]
  selected: string
  onSelect: (value: string) => void
  onClear: () => void
  scroll?: boolean
}) {
  return (
    <fieldset className="facet">
      <legend>{legend}</legend>
      <div className={scroll ? 'facet-scroll' : undefined}>
        <button
          type="button"
          className={selected ? 'facet-row' : 'facet-row active'}
          aria-pressed={!selected}
          onClick={onClear}
        >
          <span>{allLabel}</span>
          <span className="facet-count">{allCount}</span>
        </button>
        {buckets.map((bucket) => (
          <button
            key={bucket.value}
            type="button"
            className={selected === bucket.value ? 'facet-row active' : 'facet-row'}
            aria-pressed={selected === bucket.value}
            onClick={() =>
              selected === bucket.value ? onClear() : onSelect(bucket.value)
            }
          >
            <span>{bucket.label}</span>
            <span className="facet-count">{bucket.count}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function Facets({
  filters,
  desks,
  decades,
  years,
  bylines,
  deskTotal,
  dateTotal,
  bylineTotal,
  onChange,
}: Props) {
  const decade = selectedPreset(filters, DECADES)
  const year =
    filters.from &&
    filters.to &&
    filters.from.endsWith('-01-01') &&
    filters.to.endsWith('-12-31') &&
    filters.from.slice(0, 4) === filters.to.slice(0, 4)
      ? filters.from.slice(0, 4)
      : ''
  const dateSentinel = filters.from || filters.to ? '_' : ''

  function setDesk(topic: string) {
    onChange({ ...filters, topic: isTopic(topic) ? topic : '' })
  }

  function setDate(from: string, to: string) {
    onChange({ ...filters, from, to })
  }

  function clearDate() {
    onChange({ ...filters, from: '', to: '' })
  }

  return (
    <aside className="facets" aria-label="Refine the archive">
      <FacetList
        legend="Desk"
        allLabel="All desks"
        allCount={deskTotal}
        buckets={desks}
        selected={filters.topic}
        onSelect={setDesk}
        onClear={() => onChange({ ...filters, topic: '' })}
      />

      <FacetList
        legend="Decade"
        allLabel="All years"
        allCount={dateTotal}
        buckets={decades}
        selected={decade?.id ?? dateSentinel}
        onSelect={(id) => {
          const preset = DECADES.find((item) => item.id === id)
          if (preset) setDate(preset.from, preset.to)
        }}
        onClear={clearDate}
      />

      <FacetList
        legend="Year"
        allLabel="Any year"
        allCount={dateTotal}
        buckets={years}
        selected={year || dateSentinel}
        onSelect={(value) => {
          const preset = yearPreset(Number(value))
          setDate(preset.from, preset.to)
        }}
        onClear={clearDate}
        scroll
      />

      <fieldset className="facet">
        <legend>Custom dates</legend>
        <label className="field">
          From
          <input
            type="date"
            min="2006-10-31"
            max="2026-10-20"
            value={filters.from}
            onChange={(event) => setDate(event.target.value, filters.to)}
          />
        </label>
        <label className="field">
          To
          <input
            type="date"
            min="2006-10-31"
            max="2026-10-20"
            value={filters.to}
            onChange={(event) => setDate(filters.from, event.target.value)}
          />
        </label>
      </fieldset>

      <FacetList
        legend="Byline"
        allLabel="All bylines"
        allCount={bylineTotal}
        buckets={bylines}
        selected={filters.author}
        onSelect={(author) => onChange({ ...filters, author })}
        onClear={() => onChange({ ...filters, author: '' })}
      />
    </aside>
  )
}
