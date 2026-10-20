/** Clusters of meaning used to expand a natural-language ask into the words the copy actually uses. */
const CLUSTERS: string[][] = [
  [
    'arkham',
    'asylum',
    'patients',
    'intake',
    'riot',
    'ward',
    'beds',
    'census',
    'insane',
    'hospital',
    'gate',
    'west',
    'overcrowded',
    'crowding',
    'occupancy',
  ],
  [
    'vigilante',
    'batman',
    'rooftop',
    'roof',
    'cape',
    'silhouette',
    'signal',
    'ledge',
    'bat',
    'unidentified',
    'unconfirmed',
    'spotlight',
  ],
  [
    'penguin',
    'cobblepot',
    'iceberg',
    'lounge',
    'bird',
    'oswald',
    'mister',
  ],
  ['falcone', 'maroni', 'docket', 'indictment', 'mob', 'family', 'convoy', 'ceasefire'],
  ['gordon', 'commissioner', 'gcpd', 'precinct', 'patrol', 'overtime', 'ghost'],
  ['wayne', 'tower', 'foundation', 'bruce', 'lucius', 'enterprises', 'manor', 'gala'],
  ['dent', 'da', 'prosecutor', 'courthouse', 'acid', 'mural', 'trial', 'jury'],
  ['toxin', 'scarecrow', 'plume', 'chemical', 'ace', 'fear', 'hazmat', 'panic'],
  ['flood', 'narrows', 'river', 'sirens', 'pumps', 'floodwalls', 'water'],
  ['monarch', 'theatre', 'marquee', 'alley', 'fire', 'movie'],
  ['tram', 'subway', 'tunnel', 'crack', 'transit', 'violin'],
  ['blackout', 'grid', 'lights', 'electric', 'dark'],
  ['mayor', 'hill', 'garcia', 'council', 'cityhall', 'election', 'budget'],
  ['owl', 'owls', 'court', 'secret', 'club', 'locked'],
]

const RELATED = new Map<string, string[]>()
for (const cluster of CLUSTERS) {
  for (const term of cluster) {
    RELATED.set(term, cluster)
  }
}

export function relatedTerms(token: string): string[] {
  return RELATED.get(token) ?? [token]
}

export function expandQueryTerms(tokens: string[]): string[] {
  const seen = new Set<string>()
  const expanded: string[] = []
  for (const token of tokens) {
    for (const related of relatedTerms(token)) {
      if (seen.has(related)) continue
      seen.add(related)
      expanded.push(related)
    }
  }
  return expanded
}
