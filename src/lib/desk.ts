import { ARTICLES, ARCHIVE_END, ARCHIVE_START, articleBySlug, articlesByAuthor } from '../data/articles'
import { AUTHORS, authorByName } from '../data/authors'
import type { Article, SearchFilters } from '../types'
import { formatShare, isTrackedSearch, logSearchNow, summarize } from './analytics'
import { formatDate } from './format'
import { parseNaturalQuery } from './nl'
import { EMPTY_FILTERS, searchArticles } from './search'
import { queryTokens, tokenize } from './fuzzy'
import { relatedTerms } from './concepts'

export type DeskTrace = {
  label: string
}

export type DeskCitation = {
  slug: string
  title: string
  author: string
  date: string
  dek: string
}

export type DeskReply = {
  text: string
  traces: DeskTrace[]
  citations: DeskCitation[]
  followUps: string[]
  archiveHref?: string
}

export type DeskMemory = {
  lastQuery: string
  lastSlugs: string[]
  lastAuthor: string
  lastTopic: string
}

export const EMPTY_MEMORY: DeskMemory = {
  lastQuery: '',
  lastSlugs: [],
  lastAuthor: '',
  lastTopic: '',
}

export const STARTER_ASKS = [
  "What's happening at the asylum?",
  'Who owns the Iceberg Lounge?',
  'Vale on the penguin in 2018',
  'Who is the man on the roof?',
  'What does the city keep asking?',
]

type Intent =
  | 'greet'
  | 'thanks'
  | 'paper'
  | 'ledger'
  | 'author'
  | 'count'
  | 'latest'
  | 'first'
  | 'who_wrote'
  | 'more'
  | 'nth'
  | 'ask'

function stripDateline(text: string) {
  return text.replace(/^GOTHAM\s+[—–-]\s+/i, '').trim()
}

function cite(article: Article): DeskCitation {
  return {
    slug: article.slug,
    title: article.title,
    author: article.author,
    date: article.date,
    dek: article.dek,
  }
}

function archiveHref(filters: SearchFilters) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.topic) params.set('topic', filters.topic)
  if (filters.author) params.set('author', filters.author)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  const query = params.toString()
  return query ? `/archive?${query}` : '/archive'
}

function filtersFromAsk(ask: string): SearchFilters {
  const parsed = parseNaturalQuery(ask)
  return {
    ...EMPTY_FILTERS,
    q: ask,
    topic: parsed.topic,
    author: parsed.author,
    from: parsed.from,
    to: parsed.to,
  }
}

function searchMorgue(filters: SearchFilters, limit = 5) {
  const results = searchArticles(ARTICLES, filters)
  if (isTrackedSearch(filters)) logSearchNow(filters, results.length)
  return results.slice(0, limit)
}

function sentencesOf(article: Article) {
  return [article.dek, ...article.body]
    .flatMap((block) => block.split(/(?<=[.!?])\s+/))
    .map(stripDateline)
    .filter((sentence) => sentence.length > 28)
}

function passageScore(sentence: string, tokens: string[], who: boolean) {
  const words = new Set(tokenize(sentence))
  let score = 0
  for (const token of tokens) {
    if (words.has(token)) score += 2
    for (const related of relatedTerms(token)) {
      if (related !== token && words.has(related)) score += 1
    }
  }
  if (who && /\b(owns?|owner|wrote|byline|attorney|holding|license|regulars|staff)\b/i.test(sentence)) {
    score += 3
  }
  return score
}

function bestPassage(article: Article, ask: string, who = false) {
  const tokens = queryTokens(parseNaturalQuery(ask).content || ask)
  const ranked = sentencesOf(article)
    .map((sentence) => ({ sentence, score: passageScore(sentence, tokens, who) }))
    .sort((a, b) => b.score - a.score)
  return ranked[0] && ranked[0].score > 0 ? ranked[0].sentence : stripDateline(article.body[0] ?? article.dek)
}

function followUpsFor(articles: Article[], ask: string): string[] {
  const lead = articles[0]
  const parsed = parseNaturalQuery(ask)
  const next = [
    lead ? 'Who wrote that?' : '',
    lead ? `What else from ${lead.topic}?` : '',
    parsed.author ? `Latest from ${parsed.author}` : '',
    articles[1] ? 'The second piece' : '',
  ].filter(Boolean)
  return [...new Set(next)].slice(0, 3)
}

function remember(articles: Article[], ask: string, extra: Partial<DeskMemory> = {}): DeskMemory {
  const parsed = parseNaturalQuery(ask)
  return {
    lastQuery: parsed.content || ask,
    lastSlugs: articles.map((article) => article.slug),
    lastAuthor: articles[0]?.author || parsed.author,
    lastTopic: articles[0]?.topic || parsed.topic,
    ...extra,
  }
}

function nthFromMemory(memory: DeskMemory, index: number) {
  const slug = memory.lastSlugs[index]
  return slug ? articleBySlug(slug) : undefined
}

function classify(raw: string, memory: DeskMemory): { intent: Intent; ask: string; index?: number } {
  const text = raw.trim()
  const lower = text.toLowerCase()
  const parsed = parseNaturalQuery(text)

  if (/^(hi|hello|hey|good (evening|night)|night desk)\b/.test(lower)) return { intent: 'greet', ask: text }
  if (/^(thanks|thank you|thx|cheers)\b/.test(lower)) return { intent: 'thanks', ask: text }
  if (
    /\b(who are you|what are you|this paper|night edition|newsroom|how (do you|does this) (work|search)|when did (you|the paper) (start|begin))\b/.test(
      lower,
    )
  ) {
    return { intent: 'paper', ask: text }
  }
  if (/\b(ledger|people ask|city ask|popular asks?|dead ends?|what do they ask)\b/.test(lower)) {
    return { intent: 'ledger', ask: text }
  }
  if (/\b(first edition|oldest|halloween 2006|when (did )?(you|it|the paper) (start|begin|launch))\b/.test(lower)) {
    return { intent: 'first', ask: text }
  }
  if (/\b(latest|newest|today'?s|late city|what(?:'s| is) new)\b/.test(lower)) return { intent: 'latest', ask: text }
  if (/^(who wrote (that|it|this)|whose (copy|piece)|the byline)\??$/.test(lower)) {
    return { intent: 'who_wrote', ask: text }
  }
  if (/^(more|what else|anything else|go on|and then)\??$/.test(lower)) return { intent: 'more', ask: text }
  const nth = lower.match(/^(the )?(first|second|third)( (one|piece))?\??$/)
  if (nth) {
    const names = { first: 0, second: 1, third: 2 }
    return { intent: 'nth', ask: text, index: names[nth[2] as keyof typeof names] }
  }
  if (/\b(how many|how much|number of|count of)\b/.test(lower)) return { intent: 'count', ask: text }
  if (/^what else from\b/.test(lower)) return { intent: 'more', ask: text }
  if (/^latest from\b/.test(lower) && parsed.author) return { intent: 'author', ask: text }

  const whoIs = lower.match(/^who(?:'s| is)\s+(.+?)\??$/)
  if (whoIs && parsed.author && !parsed.content) return { intent: 'author', ask: text }
  if (parsed.author && /^(tell me about|bio|profile)\b/.test(lower)) return { intent: 'author', ask: text }

  const thinFollowUp =
    memory.lastQuery &&
    !parsed.content &&
    (parsed.from || parsed.author || parsed.topic) &&
    /^(what about|and|in |from )\b/.test(lower)
  if (thinFollowUp) {
    return { intent: 'ask', ask: `${memory.lastQuery} ${text}` }
  }

  if (parsed.author && !parsed.content && !/^(who|what|when|where|why|how)\b/.test(lower)) {
    return { intent: 'author', ask: text }
  }

  return { intent: 'ask', ask: text }
}

function greetReply(): { reply: DeskReply; memory: DeskMemory } {
  return {
    reply: {
      text: `Night desk. I only answer from what this paper printed — ${ARTICLES.length} pieces, ${AUTHORS.length} bylines, 2006 to 2026. Ask about the asylum, the Lounge, a rooftop, a year, or a name on the masthead.`,
      traces: [{ label: 'Clerk on the line' }],
      citations: [],
      followUps: STARTER_ASKS.slice(0, 3),
    },
    memory: EMPTY_MEMORY,
  }
}

function paperReply(): { reply: DeskReply; memory: DeskMemory } {
  const first = ARTICLES.findLast((article) => article.date === ARCHIVE_START)
  const citations = first ? [cite(first)] : []
  return {
    reply: {
      text: `Gotham Night Edition is the late city run out of a Tricorner press bay. First edition ${formatDate(ARCHIVE_START)}. Latest copy ${formatDate(ARCHIVE_END)}. ${ARTICLES.length} pieces in the basement, six desks, ${AUTHORS.length} bylines. I search that morgue — I do not invent the night.`,
      traces: [{ label: 'Pulled the spine' }, { label: `${ARTICLES.length} pieces on file` }],
      citations,
      followUps: ['The first edition', 'Latest copy', 'Who is Jack Ryder?'],
      archiveHref: '/archive',
    },
    memory: remember(first ? [first] : [], 'night edition'),
  }
}

function ledgerReply(): { reply: DeskReply; memory: DeskMemory } {
  const report = summarize()
  const top = report.topAsks
    .filter((ask) => ask.hits > 0)
    .slice(0, 3)
    .map((ask) => `“${ask.q}”`)
    .join(', ')
  const dead = report.deadEnds[0]?.q
  return {
    reply: {
      text: `The search ledger has ${report.searches} asks. ${formatShare(report.zeroRate)} die in the stacks. ${formatShare(report.ctr)} follow a piece. The night keeps asking ${top || 'whatever is on the spike'}.${dead ? ` Dead end worth a look: “${dead}.”` : ''}`,
      traces: [{ label: 'Opened the search ledger' }, { label: `${report.searches} asks on the board` }],
      citations: report.opened.slice(0, 3).map((row) => {
        const article = articleBySlug(row.slug)
        return article
          ? cite(article)
          : { slug: row.slug, title: row.title, author: '', date: '', dek: '' }
      }),
      followUps: report.topAsks.filter((ask) => ask.hits > 0).slice(0, 3).map((ask) => ask.q),
      archiveHref: '/ledger',
    },
    memory: EMPTY_MEMORY,
  }
}

function authorReply(ask: string): { reply: DeskReply; memory: DeskMemory } {
  const parsed = parseNaturalQuery(ask)
  const author = authorByName(parsed.author) ?? AUTHORS.find((person) => ask.toLowerCase().includes(person.name.toLowerCase()))
  if (!author) {
    return askReply(ask, EMPTY_MEMORY)
  }
  const pieces = articlesByAuthor(author.name)
  const latest = pieces[0]
  const traces: DeskTrace[] = [
    { label: `Byline · ${author.name}` },
    { label: `${pieces.length} pieces on the spike` },
  ]
  const citations = pieces.slice(0, 3).map(cite)
  return {
    reply: {
      text: `${author.name} is ${author.title}. ${author.bio}${latest ? ` Latest on file: “${latest.title}” (${formatDate(latest.date)}).` : ''}`,
      traces,
      citations,
      followUps: latest ? [`Latest from ${author.name}`, 'Who wrote that?'] : STARTER_ASKS.slice(0, 2),
      archiveHref: `/author/${author.slug}`,
    },
    memory: remember(pieces.slice(0, 3), author.name, { lastAuthor: author.name }),
  }
}

function countReply(ask: string): { reply: DeskReply; memory: DeskMemory } {
  const filters = filtersFromAsk(ask)
  const parsed = parseNaturalQuery(ask)
  const results = searchArticles(ARTICLES, filters)
  if (isTrackedSearch(filters)) logSearchNow(filters, results.length)
  const heard = parsed.heard.join(' · ') || parsed.content || 'the morgue'
  const lead = results[0]
  const traces: DeskTrace[] = [
    { label: `Heard as ${heard}` },
    { label: `Counted ${results.length} ${results.length === 1 ? 'piece' : 'pieces'}` },
  ]
  if (!results.length) {
    return {
      reply: {
        text: `Nothing in this basement matches that count. The Night Edition only tallies its own copy.`,
        traces,
        citations: [],
        followUps: STARTER_ASKS.slice(0, 3),
        archiveHref: archiveHref(filters),
      },
      memory: EMPTY_MEMORY,
    }
  }
  return {
    reply: {
      text: `The morgue has ${results.length} ${results.length === 1 ? 'piece' : 'pieces'} close to that. Closest is “${lead.title}” by ${lead.author}, ${formatDate(lead.date)}. ${lead.dek}`,
      traces,
      citations: results.slice(0, 4).map(cite),
      followUps: followUpsFor(results, ask),
      archiveHref: archiveHref(filters),
    },
    memory: remember(results.slice(0, 4), ask),
  }
}

function latestReply(): { reply: DeskReply; memory: DeskMemory } {
  const latest = ARTICLES.slice(0, 3)
  const lead = latest[0]
  return {
    reply: {
      text: `Late city lead: “${lead.title}” — ${lead.dek} ${lead.author} filed it ${formatDate(lead.date)}. ${stripDateline(lead.body[0] ?? '')}`,
      traces: [{ label: 'Pulled the late city spike' }, { label: `Read ${lead.title}` }],
      citations: latest.map(cite),
      followUps: ['Who wrote that?', 'The first edition', 'What does the city keep asking?'],
      archiveHref: '/archive',
    },
    memory: remember(latest, 'latest'),
  }
}

function firstReply(): { reply: DeskReply; memory: DeskMemory } {
  const first = ARTICLES.findLast((article) => article.date.startsWith('2006'))
  if (!first) return greetReply()
  return {
    reply: {
      text: `Halloween 2006. “${first.title}” — ${first.dek} ${stripDateline(first.body[0] ?? '')}`,
      traces: [{ label: 'Opened the first edition' }, { label: formatDate(first.date) }],
      citations: [cite(first)],
      followUps: ['Who wrote that?', 'Latest copy', 'Who is Jack Ryder?'],
      archiveHref: '/archive?from=2006-10-31&to=2006-12-31',
    },
    memory: remember([first], 'first edition'),
  }
}

function whoWroteReply(memory: DeskMemory): { reply: DeskReply; memory: DeskMemory } {
  const article = nthFromMemory(memory, 0)
  if (!article) {
    return {
      reply: {
        text: 'No piece is on the spike yet. Ask the morgue something first.',
        traces: [{ label: 'Spike is empty' }],
        citations: [],
        followUps: STARTER_ASKS.slice(0, 3),
      },
      memory,
    }
  }
  const author = authorByName(article.author)
  return {
    reply: {
      text: `${article.author} filed “${article.title}” on ${formatDate(article.date)}.${author ? ` ${author.title}. ${author.bio}` : ''}`,
      traces: [{ label: `Byline on the spike · ${article.author}` }],
      citations: [cite(article)],
      followUps: [`Latest from ${article.author}`, `What else from ${article.topic}?`],
      archiveHref: author ? `/author/${author.slug}` : '/about',
    },
    memory: { ...memory, lastAuthor: article.author },
  }
}

function moreReply(memory: DeskMemory, ask = ''): { reply: DeskReply; memory: DeskMemory } {
  const parsed = parseNaturalQuery(ask)
  if (!memory.lastQuery && !memory.lastTopic && !parsed.topic && !parsed.author) {
    return {
      reply: {
        text: 'More of what? Give the desk a name, a year, or a desk.',
        traces: [{ label: 'Need a thread to pull' }],
        citations: [],
        followUps: STARTER_ASKS.slice(0, 3),
      },
      memory,
    }
  }
  const filters: SearchFilters = {
    ...EMPTY_FILTERS,
    q: parsed.topic || parsed.author ? '' : memory.lastQuery,
    topic: parsed.topic || (!memory.lastQuery ? (memory.lastTopic as SearchFilters['topic']) : ''),
    author: parsed.author || '',
  }
  const more = searchMorgue(filters, 8).filter((article) => !memory.lastSlugs.includes(article.slug))
  if (!more.length) {
    return {
      reply: {
        text: 'That is the bottom of the folder. Try another year, or another desk.',
        traces: [{ label: 'Folder already read' }],
        citations: [],
        followUps: STARTER_ASKS.slice(0, 2),
        archiveHref: archiveHref(filters),
      },
      memory,
    }
  }
  const lead = more[0]
  return {
    reply: {
      text: `Next on the spike: “${lead.title}” by ${lead.author}, ${formatDate(lead.date)}. ${lead.dek} ${bestPassage(lead, memory.lastQuery)}`,
      traces: [{ label: 'Pulled the next folder' }, { label: `Read ${lead.title}` }],
      citations: more.slice(0, 3).map(cite),
      followUps: followUpsFor(more, memory.lastQuery),
      archiveHref: archiveHref(filters),
    },
    memory: remember(more.slice(0, 3), memory.lastQuery, {
      lastAuthor: memory.lastAuthor,
      lastTopic: memory.lastTopic,
    }),
  }
}

function nthReply(memory: DeskMemory, index: number): { reply: DeskReply; memory: DeskMemory } {
  const article = nthFromMemory(memory, index)
  if (!article) {
    return {
      reply: {
        text: 'That slot on the spike is empty. Ask again, then pick first, second, or third.',
        traces: [{ label: 'No piece in that slot' }],
        citations: [],
        followUps: STARTER_ASKS.slice(0, 3),
      },
      memory,
    }
  }
  return {
    reply: {
      text: `“${article.title}” — ${article.dek} ${article.author}, ${formatDate(article.date)}. ${bestPassage(article, memory.lastQuery || article.title)}`,
      traces: [{ label: `Read slot ${index + 1}` }, { label: article.title }],
      citations: [cite(article)],
      followUps: ['Who wrote that?', 'What else?', STARTER_ASKS[0]],
      archiveHref: `/article/${article.slug}`,
    },
    memory: { ...memory, lastSlugs: [article.slug, ...memory.lastSlugs.filter((slug) => slug !== article.slug)] },
  }
}

function askReply(ask: string, _memory: DeskMemory): { reply: DeskReply; memory: DeskMemory } {
  const parsed = parseNaturalQuery(ask)
  const filters = filtersFromAsk(ask)
  const who = /\bwho\b/i.test(ask)
  const heard = [...parsed.heard, parsed.content].filter(Boolean).join(' · ') || ask
  const results = searchMorgue(filters, 5)
  const traces: DeskTrace[] = [
    { label: `Heard as ${heard}` },
    { label: results.length ? `Searched the morgue · ${results.length} close` : 'Searched the morgue · nothing close' },
  ]

  if (!results.length) {
    return {
      reply: {
        text: 'Not in this basement. The Night Edition answers from twenty years of its own copy — not Metropolis, not rumor, not tomorrow’s weather.',
        traces,
        citations: [],
        followUps: STARTER_ASKS.slice(0, 3),
        archiveHref: archiveHref(filters),
      },
      memory: EMPTY_MEMORY,
    }
  }

  const lead = results[0]
  traces.push({ label: `Read ${lead.title}` })
  if (results[1]) traces.push({ label: `Also ${results[1].title}` })

  const quote = bestPassage(lead, ask, who)
  const also = results[1]
    ? ` Also on file: “${results[1].title}” (${formatDate(results[1].date)}).`
    : ''
  const text = who
    ? `${lead.author} took this on ${formatDate(lead.date)} in “${lead.title}.” ${lead.dek} ${quote}${also}`
    : `Closest copy is “${lead.title}” — ${lead.dek} ${lead.author} filed it ${formatDate(lead.date)}. ${quote}${also}`

  return {
    reply: {
      text,
      traces,
      citations: results.slice(0, 3).map(cite),
      followUps: followUpsFor(results, ask),
      archiveHref: archiveHref(filters),
    },
    memory: remember(results.slice(0, 3), ask),
  }
}

export function runDesk(question: string, memory: DeskMemory): { reply: DeskReply; memory: DeskMemory } {
  const classified = classify(question, memory)
  switch (classified.intent) {
    case 'greet':
      return greetReply()
    case 'thanks':
      return {
        reply: {
          text: 'The tip line is still open after dark.',
          traces: [{ label: 'Noted' }],
          citations: [],
          followUps: STARTER_ASKS.slice(0, 3),
        },
        memory,
      }
    case 'paper':
      return paperReply()
    case 'ledger':
      return ledgerReply()
    case 'author':
      return authorReply(classified.ask)
    case 'count':
      return countReply(classified.ask)
    case 'latest':
      return latestReply()
    case 'first':
      return firstReply()
    case 'who_wrote':
      return whoWroteReply(memory)
    case 'more':
      return moreReply(memory, classified.ask)
    case 'nth':
      return nthReply(memory, classified.index ?? 0)
    default:
      return askReply(classified.ask, memory)
  }
}
