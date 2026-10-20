const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'of',
  'and',
  'or',
  'in',
  'on',
  'to',
  'for',
  'is',
  'at',
  'by',
  'as',
  'with',
  'from',
  'its',
  'into',
  'over',
  'than',
  'that',
  'this',
  'was',
  'were',
  'be',
  'been',
  'but',
  'not',
  'no',
  'so',
  'if',
  'it',
  'we',
  'our',
])

/** Common desk typos and Gotham names, mapped to the token that actually appears in copy. */
const ALIASES: Record<string, string> = {
  arkam: 'arkham',
  arkum: 'arkham',
  archem: 'arkham',
  arkhams: 'arkham',
  pengin: 'penguin',
  pengiun: 'penguin',
  penguins: 'penguin',
  iceburg: 'iceberg',
  iceberge: 'iceberg',
  gothum: 'gotham',
  gothom: 'gotham',
  gothams: 'gotham',
  vigilent: 'vigilante',
  vigelante: 'vigilante',
  vigilante: 'vigilante',
  coblepot: 'cobblepot',
  cobblpot: 'cobblepot',
  cobblepott: 'cobblepot',
  vail: 'vale',
  enterprize: 'enterprises',
  enterprizes: 'enterprises',
  enterpirse: 'enterprises',
  commisioner: 'commissioner',
  comissioner: 'commissioner',
  falconi: 'falcone',
  maronni: 'maroni',
  marony: 'maroni',
  dentt: 'dent',
  gordon: 'gordon',
  gordan: 'gordon',
  knoxx: 'knox',
  ryder: 'ryder',
  rider: 'ryder',
  gleeson: 'gleeson',
  gleason: 'gleeson',
  wayne: 'wayne',
  wane: 'wayne',
  gcpd: 'gcpd',
  batmann: 'vigilante',
  batman: 'vigilante',
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).map((token) =>
    token.replace(/'/g, ''),
  )
}

export function queryTokens(text: string): string[] {
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const token of tokenize(text)) {
    if (token.length < 2 || STOPWORDS.has(token) || seen.has(token)) continue
    seen.add(token)
    tokens.push(token)
  }
  return tokens
}

export function variantsFor(token: string): string[] {
  return ALIASES[token] ? [ALIASES[token]] : [token]
}

/** Damerau–Levenshtein, capped so short tokens cannot wander into unrelated words. */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > max) return max + 1

  const rows: number[][] = Array.from({ length: la + 1 }, () => new Array<number>(lb + 1).fill(0))
  for (let i = 0; i <= la; i++) rows[i][0] = i
  for (let j = 0; j <= lb; j++) rows[0][j] = j

  for (let i = 1; i <= la; i++) {
    let rowMin = rows[i][0]
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let next = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        next = Math.min(next, rows[i - 2][j - 2] + 1)
      }
      rows[i][j] = next
      if (next < rowMin) rowMin = next
    }
    if (rowMin > max) return max + 1
  }

  return rows[la][lb]
}

export function tokenSimilarity(query: string, candidate: string): number {
  if (query === candidate) return 1
  if (query.length < 3) return candidate.startsWith(query) ? 0.92 : 0

  // User abbreviated a longer word: "pengu" → "penguin"
  if (candidate.startsWith(query)) return 0.9
  // Near-complete truncation, not a short stem like "ice" for "iceberg"
  if (
    candidate.length >= 4 &&
    query.startsWith(candidate) &&
    candidate.length >= query.length - 1
  ) {
    return 0.88
  }
  if (query.length >= 4 && candidate.includes(query)) return 0.78

  const longest = Math.max(query.length, candidate.length)
  const allowed = query.length <= 5 ? 1 : 2
  const distance = editDistance(query, candidate, allowed)
  if (distance > allowed) return 0
  if (distance / longest >= 0.25) return 0
  if (distance === 1 && longest >= 5) return 0.72
  if (distance === 2 && longest >= 7) return 0.55
  return 0
}

export function bestTokenMatch(queryToken: string, fieldTokens: string[]): {
  score: number
  token: string
} {
  let score = 0
  let token = ''
  for (const variant of variantsFor(queryToken)) {
    for (const candidate of fieldTokens) {
      const next = tokenSimilarity(variant, candidate)
      if (next > score) {
        score = next
        token = candidate
      }
      if (score === 1) return { score, token }
    }
  }
  return { score, token }
}

export function bestTokenSimilarity(queryToken: string, fieldTokens: string[]): number {
  return bestTokenMatch(queryToken, fieldTokens).score
}
