const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export function formatShortDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export function formatRange(from: string, to: string) {
  if (from && to) return `${formatShortDate(from)} – ${formatShortDate(to)}`
  if (from) return `From ${formatShortDate(from)}`
  if (to) return `Through ${formatShortDate(to)}`
  return ''
}

export function yearOf(iso: string) {
  return Number(iso.slice(0, 4))
}

export function topicSlug(topic: string) {
  return slugify(topic)
}

export function displayTopic(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
