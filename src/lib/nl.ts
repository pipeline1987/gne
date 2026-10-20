import { AUTHORS } from '../data/authors'
import { TOPICS, type SearchFilters, type Topic } from '../types'
import { queryTokens, tokenize } from './fuzzy'

const QUESTION_CUE =
  /^(what|whats|who|whos|where|when|why|how|tell|show|find|search|looking|any|got|give|need|want|i)\b|\?|\b(stories|articles|news|copy|coverage)\s+(about|on|of)\b/

const FILLER = new Set([
  'what',
  'whats',
  'who',
  'whos',
  'where',
  'when',
  'why',
  'how',
  'tell',
  'show',
  'me',
  'us',
  'about',
  'regarding',
  'concerning',
  'related',
  'please',
  'can',
  'could',
  'would',
  'you',
  'find',
  'looking',
  'look',
  'search',
  'searching',
  'any',
  'some',
  'latest',
  'recent',
  'happening',
  'going',
  'news',
  'story',
  'stories',
  'article',
  'articles',
  'piece',
  'pieces',
  'copy',
  'coverage',
  'report',
  'reports',
  'something',
  'anything',
  'info',
  'information',
  'did',
  'does',
  'do',
  'there',
  'so',
  'many',
  'much',
  'get',
  'got',
  'give',
  'want',
  'need',
  'i',
  'im',
  'know',
  'wondering',
  'write',
  'wrote',
  'written',
  'cover',
  'covered',
  'covering',
  'ask',
  'asked',
  'asking',
  'still',
  'ever',
  'around',
  'across',
  'at',
  'on',
  'is',
  'are',
  'the',
  'a',
  'an',
  'of',
  'to',
  'for',
  'in',
  'with',
  'from',
  'into',
  'over',
  'gotham',
  'city',
  'night',
  'edition',
  'paper',
  'desk',
  'beat',
])

export type ParsedQuery = {
  content: string
  topic: Topic | ''
  author: string
  from: string
  to: string
  natural: boolean
  heard: string[]
}

function isNaturalLanguage(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return false
  if (QUESTION_CUE.test(trimmed.toLowerCase())) return true
  if (tokenize(trimmed).length >= 4) return true
  return false
}

function yearBounds(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

export function parseNaturalQuery(raw: string): ParsedQuery {
  let text = raw.trim()
  const heard: string[] = []
  let topic: Topic | '' = ''
  let author = ''
  let from = ''
  let to = ''
  const natural = isNaturalLanguage(text)

  const between = text.match(/\bbetween\s+(20\d{2})\s+and\s+(20\d{2})\b/i)
  if (between) {
    const start = Number(between[1])
    const end = Number(between[2])
    from = yearBounds(Math.min(start, end)).from
    to = yearBounds(Math.max(start, end)).to
    heard.push(`${Math.min(start, end)}–${Math.max(start, end)}`)
    text = text.replace(between[0], ' ')
  }

  const yearHits = [...text.matchAll(/\b(?:in|from|during|year)\s+(20\d{2})\b/gi)]
  if (!from && yearHits.length > 0) {
    const year = Number(yearHits[0][1])
    const bounds = yearBounds(year)
    from = bounds.from
    to = bounds.to
    heard.push(String(year))
    text = text.replace(yearHits[0][0], ' ')
  }

  const bareYear = text.match(/\b(20(?:0[6-9]|1\d|2[0-6]))\b/)
  if (!from && bareYear && natural) {
    const bounds = yearBounds(Number(bareYear[1]))
    from = bounds.from
    to = bounds.to
    heard.push(bareYear[1])
    text = text.replace(bareYear[0], ' ')
  }

  for (const person of AUTHORS) {
    const full = new RegExp(`\\b${person.name.replace(' ', '\\s+')}\\b`, 'i')
    const last = person.name.split(' ').at(-1) ?? ''
    if (full.test(text) || new RegExp(`\\b${last}'?s?\\b`, 'i').test(text)) {
      author = person.name
      heard.push(person.name)
      text = text.replace(full, ' ')
      text = text.replace(new RegExp(`\\b${last}'?s?\\b`, 'i'), ' ')
      break
    }
  }

  const topicMatch = text.match(
    /\b(city hall|crime|business|arkham|culture|opinion)(?:\s+(?:desk|beat|stories|news|copy))?\b/i,
  )
  if (topicMatch) {
    const label = topicMatch[1].toLowerCase()
    const found = TOPICS.find((item) => item.toLowerCase() === label)
    if (found) {
      topic = found
      heard.push(found)
      text = text.replace(topicMatch[0], ' ')
    }
  }

  const contentTokens = tokenize(text).filter((token) => token.length > 1 && !FILLER.has(token))
  const content = contentTokens.join(' ')

  return { content, topic, author, from, to, natural, heard }
}

export function effectiveFilters(filters: SearchFilters, parsed: ParsedQuery): SearchFilters {
  return {
    q: parsed.content || filters.q,
    topic: filters.topic || parsed.topic,
    author: filters.author || parsed.author,
    from: filters.from || parsed.from,
    to: filters.to || parsed.to,
  }
}

export function contentTokens(parsed: ParsedQuery, fallbackQuery: string) {
  if (parsed.content) return queryTokens(parsed.content)
  if (parsed.heard.length > 0) return []
  return queryTokens(fallbackQuery)
}
