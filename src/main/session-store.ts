// src/main/session-store.ts
import { readFile, writeFile, mkdir, readdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import {
  type Session,
  type SessionSummary,
  type Message,
  type CreateSessionParams,
} from '../shared/types'
import {
  getSessionDir,
  getSessionMetadataPath,
  getSessionMessagesPath,
  getSessionsDir,
  getAppDataDir,
} from './path-utils'

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  await ensureDir(getSessionsDir())
  const entries = await readdir(getSessionsDir(), { withFileTypes: true })
  const sessions: SessionSummary[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metaPath = getSessionMetadataPath(entry.name)
    if (!existsSync(metaPath)) continue
    try {
      const raw = await readFile(metaPath, 'utf-8')
      sessions.push(JSON.parse(raw) as SessionSummary)
    } catch {
      // Skip corrupted sessions
    }
  }

  return sessions.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function createSession(params: CreateSessionParams): Promise<Session> {
  await ensureDir(getAppDataDir())
  await ensureDir(getSessionsDir())

  const now = new Date().toISOString()
  const session: Session = {
    id: uuidv4(),
    name: params.name,
    workDir: params.workDir,
    model: params.model ?? 'claude-sonnet-4-6',
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    messages: [],
  }

  const sessionDir = getSessionDir(session.id)
  await mkdir(sessionDir, { recursive: true })

  const { messages, ...summary } = session
  await writeFile(getSessionMetadataPath(session.id), JSON.stringify(summary, null, 2), 'utf-8')
  await writeFile(getSessionMessagesPath(session.id), '', 'utf-8')

  return session
}

export async function getSession(id: string): Promise<Session | null> {
  const metaPath = getSessionMetadataPath(id)
  if (!existsSync(metaPath)) return null

  const rawMeta = await readFile(metaPath, 'utf-8')
  const summary = JSON.parse(rawMeta) as SessionSummary

  const messagesPath = getSessionMessagesPath(id)
  const messages: Message[] = []
  if (existsSync(messagesPath)) {
    const raw = await readFile(messagesPath, 'utf-8')
    const lines = raw.trim().split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        messages.push(JSON.parse(line) as Message)
      } catch {
        // Skip corrupted lines
      }
    }
  }

  return { ...summary, messages }
}

export async function deleteSession(id: string): Promise<void> {
  const dir = getSessionDir(id)
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function appendMessage(
  sessionId: string,
  message: Message
): Promise<void> {
  await ensureDir(getSessionDir(sessionId))

  // Append to .jsonl
  const messagesPath = getSessionMessagesPath(sessionId)
  const line = JSON.stringify(message) + '\n'
  await writeFile(messagesPath, line, { flag: 'a' })

  // Update metadata
  const metaPath = getSessionMetadataPath(sessionId)
  if (existsSync(metaPath)) {
    const raw = await readFile(metaPath, 'utf-8')
    const meta = JSON.parse(raw) as SessionSummary
    meta.updatedAt = new Date().toISOString()
    meta.messageCount = (meta.messageCount ?? 0) + 1
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  }
}
