// src/main/path-utils.ts
import { join } from 'path'
import os from 'os'

/**
 * Get the application data directory for claude-code-desktop.
 * On Windows: %USERPROFILE%/.claude-code-desktop
 * On macOS:   ~/.claude-code-desktop
 * On Linux:   ~/.claude-code-desktop
 */
export function getAppDataDir(): string {
  return join(os.homedir(), '.claude-code-desktop')
}

/**
 * Get the sessions storage directory.
 */
export function getSessionsDir(): string {
  return join(getAppDataDir(), 'sessions')
}

/**
 * Get the directory for a specific session.
 */
export function getSessionDir(sessionId: string): string {
  return join(getSessionsDir(), sessionId)
}

/**
 * Get the path to a session's metadata JSON file (summary info).
 */
export function getSessionMetadataPath(sessionId: string): string {
  return join(getSessionDir(sessionId), 'meta.json')
}

/**
 * Get the path to a session's messages JSONL file.
 */
export function getSessionMessagesPath(sessionId: string): string {
  return join(getSessionDir(sessionId), 'messages.jsonl')
}

/**
 * Get the path to the groups storage file.
 */
export function getGroupsPath(): string {
  return join(getAppDataDir(), 'groups.json')
}

/**
 * Get the path to the settings JSON file.
 */
export function getSettingsPath(): string {
  return join(getAppDataDir(), 'settings.json')
}
