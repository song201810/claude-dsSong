// src/main/config-manager.ts
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { type Settings, type ModelInfo } from '../shared/types'
import { getSettingsPath, getAppDataDir } from './path-utils'

const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4-8',
    name: 'Opus 4.8',
    description: '最强大的模型，适合复杂任务',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Sonnet 4.6',
    description: '性能与速度的平衡',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Haiku 4.5',
    description: '最快的模型，适合简单任务',
  },
  {
    id: 'claude-fable-5',
    name: 'Fable 5',
    description: '最新的 Claude 模型',
  },
]

const DEFAULT_SETTINGS: Settings = {
  defaultModel: 'claude-sonnet-4-6',
  models: DEFAULT_MODELS,
}

export async function getSettings(): Promise<Settings> {
  await mkdir(getAppDataDir(), { recursive: true }).catch(() => {})

  const path = getSettingsPath()
  if (!existsSync(path)) {
    await writeFile(path, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
    return { ...DEFAULT_SETTINGS }
  }

  const raw = await readFile(path, 'utf-8')
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const updated = { ...current, ...partial }
  await writeFile(getSettingsPath(), JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

export async function getModels(): Promise<ModelInfo[]> {
  const settings = await getSettings()
  return settings.models
}
