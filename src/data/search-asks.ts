import type { Topic } from '../types'

export type SeedAsk = {
  q?: string
  topic?: Topic | ''
  author?: string
  from?: string
  to?: string
  daysAgo: number
  hour: number
  clickRank?: number
}

/** Fourteen nights of dummy night-desk asks. Hits and clicks are resolved at runtime. */
export const SEED_ASKS: SeedAsk[] = [
  { q: "what's happening at the asylum", daysAgo: 0, hour: 21, clickRank: 1 },
  { q: 'asylum', daysAgo: 0, hour: 20, clickRank: 1 },
  { q: 'who owns the Iceberg Lounge', daysAgo: 0, hour: 19, clickRank: 1 },
  { q: 'pengiun', daysAgo: 0, hour: 18, clickRank: 1 },
  { q: 'superman', daysAgo: 0, hour: 17 },
  { q: 'man on the roof', daysAgo: 0, hour: 16, clickRank: 1 },
  { q: 'overcrowded beds', daysAgo: 1, hour: 23, clickRank: 1 },
  { q: 'Vale on the penguin in 2018', daysAgo: 1, hour: 22, clickRank: 1 },
  { q: 'crime in 2012', daysAgo: 1, hour: 21, clickRank: 1 },
  { q: 'arkham', daysAgo: 1, hour: 20, clickRank: 1 },
  { q: 'arkum', daysAgo: 1, hour: 19, clickRank: 2 },
  { q: 'metropolis', daysAgo: 1, hour: 18 },
  { q: 'Iceberg Lounge', daysAgo: 2, hour: 22, clickRank: 1 },
  { q: 'falcone', daysAgo: 2, hour: 21, clickRank: 1 },
  { q: 'the signal on the roof', daysAgo: 2, hour: 20, clickRank: 1 },
  { q: 'wayne', daysAgo: 2, hour: 15, clickRank: 2 },
  { q: 'xyzzy', daysAgo: 2, hour: 14 },
  { topic: 'Arkham', daysAgo: 2, hour: 13, clickRank: 1 },
  { q: 'asylum', daysAgo: 3, hour: 23, clickRank: 1 },
  { q: "what's going on at the asylum", daysAgo: 3, hour: 22, clickRank: 2 },
  { q: 'cobblepot', daysAgo: 3, hour: 21, clickRank: 1 },
  { q: 'gordon', daysAgo: 3, hour: 20, clickRank: 1 },
  { q: 'daily planet', daysAgo: 3, hour: 11 },
  { q: 'blackout', daysAgo: 4, hour: 22, clickRank: 1 },
  { q: 'court of owls', daysAgo: 4, hour: 21, clickRank: 1 },
  { q: 'vail', daysAgo: 4, hour: 19, clickRank: 1 },
  { q: 'penguin', daysAgo: 4, hour: 18, clickRank: 1 },
  { q: 'kryptonite', daysAgo: 4, hour: 8 },
  { q: 'stories about the docks', daysAgo: 5, hour: 23, clickRank: 1 },
  { q: 'toxin', daysAgo: 5, hour: 21, clickRank: 1 },
  { q: 'narrows', daysAgo: 5, hour: 20, clickRank: 2 },
  { topic: 'Crime', daysAgo: 5, hour: 16, clickRank: 1 },
  { q: 'who is the vigilante', daysAgo: 6, hour: 22, clickRank: 1 },
  { q: 'asylum', daysAgo: 6, hour: 21, clickRank: 1 },
  { q: 'Iceberg Lounge owner', daysAgo: 6, hour: 18, clickRank: 1 },
  { q: 'joker wedding', daysAgo: 6, hour: 12 },
  { q: 'ace chemicals', daysAgo: 7, hour: 22, clickRank: 1 },
  { q: 'mayoral race', daysAgo: 7, hour: 20, clickRank: 1 },
  { q: 'arkham', daysAgo: 7, hour: 19, clickRank: 1 },
  { author: 'Vicki Vale', daysAgo: 7, hour: 14, clickRank: 1 },
  { q: 'pengiun', daysAgo: 8, hour: 23, clickRank: 2 },
  { q: 'floodwalls', daysAgo: 8, hour: 21, clickRank: 1 },
  { q: 'the woman who kept the riot clock', daysAgo: 8, hour: 20, clickRank: 1 },
  { q: 'superman', daysAgo: 8, hour: 9 },
  { q: 'crime alley', daysAgo: 9, hour: 22, clickRank: 1 },
  { q: 'wayne tower', daysAgo: 9, hour: 18, clickRank: 1 },
  { q: 'overcrowded beds', daysAgo: 9, hour: 17, clickRank: 1 },
  { from: '2012-01-01', to: '2012-12-31', daysAgo: 9, hour: 15, clickRank: 1 },
  { q: "what's happening at the asylum", daysAgo: 10, hour: 23, clickRank: 1 },
  { q: 'man on the roof', daysAgo: 10, hour: 21, clickRank: 2 },
  { q: 'monarch theatre', daysAgo: 10, hour: 19, clickRank: 1 },
  { q: 'metropolis weather', daysAgo: 10, hour: 10 },
  { q: 'penguin', daysAgo: 11, hour: 22, clickRank: 1 },
  { q: 'dent', daysAgo: 11, hour: 20, clickRank: 1 },
  { q: 'budget', daysAgo: 11, hour: 16, clickRank: 2 },
  { topic: 'City Hall', daysAgo: 11, hour: 13, clickRank: 1 },
  { q: 'asylum', daysAgo: 12, hour: 23, clickRank: 1 },
  { q: 'who owns the Iceberg Lounge', daysAgo: 12, hour: 21, clickRank: 1 },
  { q: 'vigilante', daysAgo: 12, hour: 20, clickRank: 1 },
  { q: 'xyzzy', daysAgo: 12, hour: 7 },
  { q: 'harbor ice', daysAgo: 13, hour: 22, clickRank: 1 },
  { q: 'arkham', daysAgo: 13, hour: 20, clickRank: 1 },
  { q: 'falcone', daysAgo: 13, hour: 18, clickRank: 2 },
  { q: 'daily planet', daysAgo: 13, hour: 11 },
]
