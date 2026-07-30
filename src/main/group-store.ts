// src/main/group-store.ts
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import type { SessionGroup } from '../shared/types'
import { getGroupsPath, getSessionMetadataPath, getSessionDir } from './path-utils'
import type { SessionSummary } from '../shared/types'
import { rm } from 'fs/promises'

interface GroupStoreFile {
  version: 1
  groups: SessionGroup[]
}

async function readStore(): Promise<GroupStoreFile> {
  const path = getGroupsPath()
  if (!existsSync(path)) {
    return { version: 1, groups: [] }
  }
  try {
    const raw = await readFile(path, 'utf-8')
    return JSON.parse(raw) as GroupStoreFile
  } catch {
    return { version: 1, groups: [] }
  }
}

async function writeStore(store: GroupStoreFile): Promise<void> {
  const path = getGroupsPath()
  await writeFile(path, JSON.stringify(store, null, 2), 'utf-8')
}

export async function listGroups(): Promise<SessionGroup[]> {
  const store = await readStore()
  // Filter out stale sessionIds that no longer exist
  const cleaned = store.groups.map(g => ({
    ...g,
    sessionIds: g.sessionIds.filter(sid => existsSync(getSessionMetadataPath(sid))),
  }))
  // Write back if we cleaned anything
  if (JSON.stringify(cleaned) !== JSON.stringify(store.groups)) {
    await writeStore({ ...store, groups: cleaned })
  }
  return cleaned
}

export async function createGroup(name: string): Promise<SessionGroup> {
  const store = await readStore()
  const group: SessionGroup = {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    sessionIds: [],
  }
  store.groups.push(group)
  await writeStore(store)
  return group
}

export async function deleteGroup(id: string, deleteSessions: boolean = false): Promise<void> {
  const store = await readStore()
  const group = store.groups.find(g => g.id === id)
  if (!group) return

  if (deleteSessions) {
    // Delete all sessions in the group entirely
    for (const sid of group.sessionIds) {
      const dir = getSessionDir(sid)
      if (existsSync(dir)) {
        await rm(dir, { recursive: true, force: true })
      }
    }
  } else {
    // Keep sessions but ungroup them — clear groupId from meta.json
    for (const sid of group.sessionIds) {
      await updateSessionGroupId(sid, undefined)
    }
  }

  store.groups = store.groups.filter(g => g.id !== id)
  await writeStore(store)
}

export async function renameGroup(id: string, name: string): Promise<SessionGroup | null> {
  const store = await readStore()
  const group = store.groups.find(g => g.id === id)
  if (!group) return null
  group.name = name
  await writeStore(store)
  return group
}

export async function addSessionToGroup(sessionId: string, groupId: string): Promise<void> {
  const store = await readStore()

  // Remove sessionId from ALL groups first (a session can only be in one group)
  for (const g of store.groups) {
    g.sessionIds = g.sessionIds.filter(sid => sid !== sessionId)
  }

  // Add to target group
  const group = store.groups.find(g => g.id === groupId)
  if (!group) return
  group.sessionIds.push(sessionId)

  // Update session metadata
  await updateSessionGroupId(sessionId, groupId)

  await writeStore(store)
}

export async function removeSessionFromGroup(sessionId: string): Promise<void> {
  const store = await readStore()
  for (const g of store.groups) {
    g.sessionIds = g.sessionIds.filter(sid => sid !== sessionId)
  }
  await updateSessionGroupId(sessionId, undefined)
  await writeStore(store)
}

// Internal helper: update groupId in a session's meta.json
async function updateSessionGroupId(sessionId: string, groupId: string | undefined): Promise<void> {
  const metaPath = getSessionMetadataPath(sessionId)
  if (!existsSync(metaPath)) return
  try {
    const raw = await readFile(metaPath, 'utf-8')
    const meta = JSON.parse(raw) as SessionSummary
    if (groupId) {
      meta.groupId = groupId
    } else {
      delete meta.groupId
    }
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  } catch {
    // Skip if meta.json is corrupted
  }
}
