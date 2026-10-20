import { EMPTY_MEMORY, runDesk, type DeskMemory, type DeskReply } from './desk'

export type ChatRole = 'user' | 'desk'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  at: string
  traces?: DeskReply['traces']
  citations?: DeskReply['citations']
  followUps?: string[]
  archiveHref?: string
}

const STORAGE_KEY = 'gne.night-desk.v1'
const listeners = new Set<() => void>()

let memory: DeskMemory = EMPTY_MEMORY
let messages: ChatMessage[] = loadMessages()

function emit() {
  for (const listener of listeners) listener()
}

function loadMessages(): ChatMessage[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as { messages?: ChatMessage[]; memory?: DeskMemory }) : null
    if (parsed?.memory) memory = parsed.memory
    return Array.isArray(parsed?.messages) ? parsed.messages : []
  } catch {
    return []
  }
}

function persist() {
  if (typeof sessionStorage === 'undefined') {
    emit()
    return
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, memory }))
  } catch {
    // Private mode still keeps the thread in memory.
  }
  emit()
}

export function subscribeDesk(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function readDeskThread() {
  return messages
}

export function postUserAsk(question: string) {
  const trimmed = question.trim()
  if (!trimmed) return ''
  const at = new Date().toISOString()
  const user: ChatMessage = {
    id: `u-${Date.parse(at)}-${messages.length}`,
    role: 'user',
    text: trimmed,
    at,
  }
  messages = [...messages, user]
  persist()
  return trimmed
}

export function answerDesk(question: string) {
  const trimmed = question.trim()
  if (!trimmed) return
  const { reply, memory: next } = runDesk(trimmed, memory)
  memory = next
  const desk: ChatMessage = {
    id: `d-${Date.now()}-${messages.length}`,
    role: 'desk',
    text: reply.text,
    at: new Date().toISOString(),
    traces: reply.traces,
    citations: reply.citations,
    followUps: reply.followUps,
    archiveHref: reply.archiveHref,
  }
  messages = [...messages, desk]
  persist()
}

export function postToDesk(question: string) {
  const trimmed = postUserAsk(question)
  if (trimmed) answerDesk(trimmed)
}

export function clearDeskThread() {
  messages = []
  memory = EMPTY_MEMORY
  persist()
}
