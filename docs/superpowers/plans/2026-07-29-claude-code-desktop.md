# Claude Code Desktop 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 从零搭建 Electron 桌面应用，封装 Claude Code CLI 为图形聊天界面

**架构：** Electron 34 主进程通过 node-pty 管理 Claude CLI 进程，React 19 渲染进程通过 IPC 通信，JSON 文件持久化会话，Tailwind CSS 4 样式

**技术栈：** Electron 34, React 19, TypeScript 5.7, electron-vite, Tailwind CSS 4, Radix UI, node-pty

---

## 文件结构总览

```
claude-code-desktop/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── electron.vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .gitignore
├── CLAUDE.md
├── resources/
│   └── icon.png
└── src/
    ├── shared/
    │   └── types.ts
    ├── main/
    │   ├── index.ts
    │   ├── claude-manager.ts
    │   ├── session-store.ts
    │   ├── config-manager.ts
    │   ├── ipc-handlers.ts
    │   └── path-utils.ts
    ├── preload/
    │   └── index.ts
    └── renderer/
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── context/
            │   └── AppContext.tsx
            ├── hooks/
            │   ├── useIpc.ts
            │   ├── useSessions.ts
            │   └── useChat.ts
            ├── components/
            │   ├── Sidebar.tsx
            │   ├── SessionList.tsx
            │   ├── SessionItem.tsx
            │   ├── ChatView.tsx
            │   ├── MessageBubble.tsx
            │   ├── InputArea.tsx
            │   ├── ModelSelect.tsx
            │   └── NewSessionModal.tsx
            └── styles/
                └── index.css
```

---

### 任务 1：初始化项目结构和依赖

**文件：**
- 创建：`package.json`
- 创建：`tsconfig.json`
- 创建：`tsconfig.node.json`
- 创建：`tsconfig.web.json`
- 创建：`electron.vite.config.ts`
- 创建：`tailwind.config.ts`
- 创建：`postcss.config.js`
- 创建：`.gitignore`

- [ ] **步骤 1：创建 package.json**

```json
{
  "name": "claude-code-desktop",
  "version": "0.1.0",
  "description": "Claude Code CLI 桌面 GUI 客户端",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  },
  "dependencies": {
    "node-pty": "^1.0.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-scroll-area": "^1.2.1",
    "@tailwindcss/postcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/uuid": "^10.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "electron": "^34.0.0",
    "electron-vite": "^2.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.6.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **步骤 2：创建 tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **步骤 3：创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./out",
    "declaration": true,
    "types": ["electron-vite/node"]
  },
  "include": [
    "src/main/**/*.ts",
    "src/preload/**/*.ts",
    "src/shared/**/*.ts",
    "electron.vite.config.ts"
  ]
}
```

- [ ] **步骤 4：创建 tsconfig.web.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./out",
    "declaration": true,
    "jsx": "react-jsx",
    "types": ["node"]
  },
  "include": [
    "src/renderer/src/**/*.ts",
    "src/renderer/src/**/*.tsx",
    "src/shared/**/*.ts"
  ]
}
```

- [ ] **步骤 5：创建 electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
    }
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'out/renderer',
    },
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    }
  }
})
```

- [ ] **步骤 6：创建 tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1b1e',
        'sidebar-hover': '#2c2d30',
        'sidebar-active': '#3a3b3f',
        main: '#1e1f22',
        bubble: {
          user: '#2b3b52',
          assistant: '#2d2f34',
        },
        input: '#313338',
        accent: '#6c8ce0',
      },
    },
  },
} satisfies Config
```

- [ ] **步骤 7：创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
  },
}
```

- [ ] **步骤 8：创建 .gitignore**

```
node_modules/
out/
dist/
.DS_Store
*.log
```

- [ ] **步骤 9：安装依赖**

```bash
cd D:/project/claude/desktop && npm install
```

- [ ] **步骤 10：测试验证**

启动项目确认编译通过：
```bash
cd D:/project/claude/desktop && npm run dev
```

**测试检查项：**
- [ ] `npm run dev` 无报错启动
- [ ] Electron 窗口正常打开
- [ ] 窗口标题显示 "Claude Code Desktop"

- [ ] **步骤 11：输出测试文档**

创建 `docs/tests/01-scaffold-test.md`，记录：
- 测试内容：项目初始化、依赖安装、开发模式启动
- 预期结果：无编译错误、窗口正常出现
- 实际结果：__（填写）__
- 是否通过：__（填写）__

- [ ] **步骤 12：Commit**

```bash
git add -A && git commit -m "feat: init electron-vite project with react + tailwind"
```

---

### 任务 2：共享类型定义

**文件：**
- 创建：`src/shared/types.ts`

- [ ] **步骤 1：创建 types.ts — IPC 通道和数据类型**

```typescript
// src/shared/types.ts

// ============ IPC 通道名称 ============

export const IPC_CHANNELS = {
  // 会话管理
  SESSION_LIST: 'session:list',
  SESSION_CREATE: 'session:create',
  SESSION_GET: 'session:get',
  SESSION_DELETE: 'session:delete',

  // 聊天控制
  CHAT_SEND: 'chat:send',
  CHAT_CANCEL: 'chat:cancel',
  CHAT_TOKEN: 'chat:token',
  CHAT_ERROR: 'chat:error',
  CHAT_DONE: 'chat:done',

  // 配置
  CONFIG_GET_MODELS: 'config:get-models',
  CONFIG_GET_SETTINGS: 'config:get-settings',
  CONFIG_UPDATE_SETTINGS: 'config:update-settings',

  // 应用
  APP_GET_INFO: 'app:get-info',
} as const

// ============ 数据类型 ============

export interface SessionSummary {
  id: string
  name: string
  workDir: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface Session extends SessionSummary {
  messages: Message[]
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  thinking?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  output?: string
  status: 'pending' | 'running' | 'done' | 'error'
}

export interface ModelInfo {
  id: string
  name: string
  description: string
}

export interface Settings {
  defaultModel: string
  models: ModelInfo[]
}

export interface CreateSessionParams {
  name: string
  workDir: string
  model?: string
}

export interface SendMessageParams {
  sessionId: string
  message: string
  model: string
}

export interface ChatTokenEvent {
  sessionId: string
  messageId: string
  token: string
  thinking?: string
}

export interface ChatErrorEvent {
  sessionId: string
  messageId: string
  error: string
}

export interface ChatDoneEvent {
  sessionId: string
  messageId: string
  fullContent: string
}
```

- [ ] **步骤 2：测试编译验证**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1
```

预期：编译无类型错误。注意 types.ts 中 `Record<string, unknown>` 在 tsconfig strict 下可以正常通过。

- [ ] **步骤 3：输出测试文档**

创建 `docs/tests/02-types-test.md`，记录类型编译检查结果。

- [ ] **步骤 4：Commit**

```bash
git add src/shared/types.ts && git commit -m "feat: define shared types and IPC channels"
```

---

### 任务 3：主进程 — 路径工具和入口

**文件：**
- 创建：`src/main/path-utils.ts`
- 创建：`src/main/index.ts`

- [ ] **步骤 1：创建 path-utils.ts**

```typescript
// src/main/path-utils.ts
import { app } from 'electron'
import { join } from 'path'

export function getAppDataDir(): string {
  return join(app.getPath('home'), '.claude-code-desktop')
}

export function getSessionsDir(): string {
  return join(getAppDataDir(), 'sessions')
}

export function getSessionDir(sessionId: string): string {
  return join(getSessionsDir(), sessionId)
}

export function getSessionMetadataPath(sessionId: string): string {
  return join(getSessionDir(sessionId), 'metadata.json')
}

export function getSessionMessagesPath(sessionId: string): string {
  return join(getSessionDir(sessionId), 'messages.jsonl')
}

export function getSettingsPath(): string {
  return join(getAppDataDir(), 'settings.json')
}
```

- [ ] **步骤 2：创建 main/index.ts — Electron 入口**

```typescript
// src/main/index.ts
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc-handlers'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1e1f22',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.claude-code-desktop')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **步骤 3：测试编译 + 启动**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1
```

- [ ] **步骤 4：输出测试文档**

创建 `docs/tests/03-main-entry-test.md`，记录主进程入口和路径工具是否正常编译。

- [ ] **步骤 5：Commit**

```bash
git add src/main/path-utils.ts src/main/index.ts && git commit -m "feat: add main process entry with path utils"
```

---

### 任务 4：主进程 — Session Store

**文件：**
- 创建：`src/main/session-store.ts`

- [ ] **步骤 1：创建 session-store.ts**

```typescript
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
      // 跳过损坏的会话
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
        // 跳过损坏的行
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

  // 追加到 .jsonl
  const messagesPath = getSessionMessagesPath(sessionId)
  const line = JSON.stringify(message) + '\n'
  await writeFile(messagesPath, line, { flag: 'a' })

  // 更新元数据
  const metaPath = getSessionMetadataPath(sessionId)
  if (existsSync(metaPath)) {
    const raw = await readFile(metaPath, 'utf-8')
    const meta = JSON.parse(raw) as SessionSummary
    meta.updatedAt = new Date().toISOString()
    meta.messageCount = (meta.messageCount ?? 0) + 1
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  }
}
```

- [ ] **步骤 2：测试编译 + 功能验证**

TypeScript 编译检查：
```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1
```

启动应用后验证：
- [ ] 启用 `npm run dev` — 启动不报错
- [ ] 确认 `~/.claude-code-desktop/` 目录创建成功
- [ ] 确认 `settings.json` 自动生成

- [ ] **步骤 3：输出测试文档**

创建 `docs/tests/04-session-store-test.md`，记录编译和基础功能验证结果。

- [ ] **步骤 4：Commit**

```bash
git add src/main/session-store.ts && git commit -m "feat: implement session store with JSON file persistence"
```

---

### 任务 5：主进程 — Claude Manager

**文件：**
- 创建：`src/main/claude-manager.ts`

- [ ] **步骤 1：创建 claude-manager.ts**

```typescript
// src/main/claude-manager.ts
import { spawn, IPty } from 'node-pty'
import { BrowserWindow } from 'electron'
import {
  type SendMessageParams,
  type ChatTokenEvent,
  type ChatErrorEvent,
  type ChatDoneEvent,
  IPC_CHANNELS,
} from '../shared/types'

interface ActiveProcess {
  pty: IPty
  messageId: string
  sessionId: string
  accumulatedContent: string
  accumulatedThinking: string
  isThinking: boolean
}

const activeProcesses = new Map<string, ActiveProcess>()

export function startChat(
  params: SendMessageParams,
  sender: BrowserWindow
): void {
  if (activeProcesses.has(params.sessionId)) {
    // 该会话已有进行中的请求，忽略
    return
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // 构建 claude CLI 命令参数
  const args = [
    '-p', params.message,
    '--model', params.model,
    '--output-format', 'stream-json',
  ]

  // 获取 shell 路径
  const shellPath = process.platform === 'win32'
    ? 'powershell.exe'
    : process.env.SHELL || '/bin/bash'

  const pty = spawn('claude', args, {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    cwd: process.cwd(),
    env: { ...process.env, TERM: 'xterm-256color' },
  })

  const process: ActiveProcess = {
    pty,
    messageId,
    sessionId: params.sessionId,
    accumulatedContent: '',
    accumulatedThinking: '',
    isThinking: false,
  }

  activeProcesses.set(params.sessionId, process)

  let buffer = ''

  pty.onData((data: string) => {
    buffer += data

    // 按行分割处理
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // 保留不完整的行

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        // Claude CLI stream-json 格式
        const parsed = JSON.parse(line)

        let tokenToSend = ''

        if (parsed.type === 'content_block_delta') {
          if (parsed.delta?.type === 'text_delta') {
            tokenToSend = parsed.delta.text
            process.accumulatedContent += tokenToSend
          } else if (parsed.delta?.type === 'thinking_delta') {
            process.accumulatedThinking += parsed.delta.thinking
            process.isThinking = true
          }
        } else if (parsed.type === 'content_block_start') {
          if (parsed.content_block?.type === 'thinking') {
            process.isThinking = true
          }
        } else if (parsed.type === 'content_block_stop') {
          process.isThinking = false
        } else if (parsed.type === 'assistant') {
          // 完整 assistant 消息
          if (parsed.message?.content) {
            for (const block of parsed.message.content) {
              if (block.type === 'text') {
                tokenToSend += block.text
              }
            }
            process.accumulatedContent += tokenToSend
          }
        } else if (parsed.type === 'error') {
          const event: ChatErrorEvent = {
            sessionId: params.sessionId,
            messageId,
            error: parsed.error?.message || '未知错误',
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, event)
          activeProcesses.delete(params.sessionId)
          return
        }

        // 如果有 token，推送到渲染进程
        if (tokenToSend) {
          const event: ChatTokenEvent = {
            sessionId: params.sessionId,
            messageId,
            token: tokenToSend,
            thinking: process.accumulatedThinking || undefined,
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, event)
        }
      } catch {
        // 非 JSON 行，可能是纯文本输出（CLI 流式模式回退）
        if (line.trim()) {
          process.accumulatedContent += line + '\n'
          const event: ChatTokenEvent = {
            sessionId: params.sessionId,
            messageId,
            token: line + '\n',
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, event)
        }
      }
    }
  })

  pty.onExit(({ exitCode }) => {
    const event: ChatDoneEvent = {
      sessionId: params.sessionId,
      messageId,
      fullContent: process.accumulatedContent,
    }
    sender.webContents.send(IPC_CHANNELS.CHAT_DONE, event)
    activeProcesses.delete(params.sessionId)
  })
}

export function cancelChat(sessionId: string): void {
  const process = activeProcesses.get(sessionId)
  if (!process) return

  try {
    // 发送 SIGINT 等价信号
    process.pty.kill()
  } catch {
    // 进程可能已经退出
  }
  activeProcesses.delete(sessionId)
}

export function isChatRunning(sessionId: string): boolean {
  return activeProcesses.has(sessionId)
}
```

- [ ] **步骤 2：测试编译**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1
```

⚠ 注意：`node-pty` 是原生模块，需在 Electron 环境中测试。此阶段仅确保编译通过。

- [ ] **步骤 3：输出测试文档**

创建 `docs/tests/05-claude-manager-test.md`，记录编译结果和 node-pty 集成注意事项。

- [ ] **步骤 4：Commit**

```bash
git add src/main/claude-manager.ts && git commit -m "feat: implement Claude CLI manager with node-pty"
```

---

### 任务 6：主进程 — Config Manager + IPC Handlers

**文件：**
- 创建：`src/main/config-manager.ts`
- 创建：`src/main/ipc-handlers.ts`

- [ ] **步骤 1：创建 config-manager.ts**

```typescript
// src/main/config-manager.ts
import { readFile, writeFile } from 'fs/promises'
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
  const { mkdir } = await import('fs/promises')
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
```

- [ ] **步骤 2：创建 ipc-handlers.ts**

```typescript
// src/main/ipc-handlers.ts
import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import { listSessions, createSession, getSession, deleteSession, appendMessage } from './session-store'
import { startChat, cancelChat } from './claude-manager'
import { getSettings, updateSettings, getModels } from './config-manager'

export function registerIpcHandlers(): void {
  // === 会话管理 ===
  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async () => {
    return await listSessions()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, async (_, params) => {
    return await createSession(params)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_, id: string) => {
    return await getSession(id)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_, id: string) => {
    await deleteSession(id)
  })

  // === 聊天控制 ===
  ipcMain.on(IPC_CHANNELS.CHAT_SEND, (event, params) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return
    startChat(params, window)
  })

  ipcMain.on(IPC_CHANNELS.CHAT_CANCEL, (_, sessionId: string) => {
    cancelChat(sessionId)
  })

  // === 配置 ===
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_MODELS, async () => {
    return await getModels()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_SETTINGS, async () => {
    return await getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE_SETTINGS, async (_, partial) => {
    return await updateSettings(partial)
  })

  // === 应用 ===
  ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, () => {
    return {
      version: '0.1.0',
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
    }
  })
}
```

- [ ] **步骤 3：测试编译**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1
```

- [ ] **步骤 4：输出测试文档**

创建 `docs/tests/06-ipc-handlers-test.md`，记录编译结果，注意此时启动会失败（缺少 renderer/preload 文件）。

- [ ] **步骤 5：Commit**

```bash
git add src/main/config-manager.ts src/main/ipc-handlers.ts && git commit -m "feat: add config manager and IPC handlers"
```

---

### 任务 7：Preload 脚本

**文件：**
- 创建：`src/preload/index.ts`

- [ ] **步骤 1：创建 preload/index.ts**

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  type SessionSummary,
  type Session,
  type Message,
  type ModelInfo,
  type Settings,
  type CreateSessionParams,
  type SendMessageParams,
  type ChatTokenEvent,
  type ChatErrorEvent,
  type ChatDoneEvent,
} from '../shared/types'

const api = {
  // === 会话 ===
  listSessions: (): Promise<SessionSummary[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),

  createSession: (params: CreateSessionParams): Promise<Session> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, params),

  getSession: (id: string): Promise<Session | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET, id),

  deleteSession: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, id),

  // === 聊天 ===
  sendMessage: (params: SendMessageParams): void =>
    ipcRenderer.send(IPC_CHANNELS.CHAT_SEND, params),

  cancelChat: (sessionId: string): void =>
    ipcRenderer.send(IPC_CHANNELS.CHAT_CANCEL, sessionId),

  onChatToken: (callback: (data: ChatTokenEvent) => void): (() => void) => {
    const handler = (_: unknown, data: ChatTokenEvent) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.CHAT_TOKEN, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_TOKEN, handler)
  },

  onChatError: (callback: (data: ChatErrorEvent) => void): (() => void) => {
    const handler = (_: unknown, data: ChatErrorEvent) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.CHAT_ERROR, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_ERROR, handler)
  },

  onChatDone: (callback: (data: ChatDoneEvent) => void): (() => void) => {
    const handler = (_: unknown, data: ChatDoneEvent) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.CHAT_DONE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_DONE, handler)
  },

  // === 配置 ===
  getModels: (): Promise<ModelInfo[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_MODELS),

  getSettings: (): Promise<Settings> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_SETTINGS),

  updateSettings: (partial: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE_SETTINGS, partial),

  // === 应用 ===
  getAppInfo: (): Promise<{ version: string; platform: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO),
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
```

- [ ] **步骤 2：测试编译**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1
```

- [ ] **步骤 3：输出测试文档**

创建 `docs/tests/07-preload-test.md`，记录 preload 脚本编译结果。

- [ ] **步骤 4：Commit**

```bash
git add src/preload/index.ts && git commit -m "feat: implement preload script with contextBridge API"
```

---

### 任务 8：渲染进程 — 入口文件 + 全局状态

**文件：**
- 创建：`src/renderer/index.html`
- 创建：`src/renderer/src/main.tsx`
- 创建：`src/renderer/src/context/AppContext.tsx`
- 创建：`src/renderer/src/types.d.ts`

- [ ] **步骤 1：创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Code Desktop</title>
  </head>
  <body class="bg-main text-white overflow-hidden">
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

- [ ] **步骤 2：创建 types.d.ts**

```typescript
// src/renderer/src/types.d.ts
import type { ElectronApi } from '../../preload/index'

declare global {
  interface Window {
    api: ElectronApi
  }
}
```

- [ ] **步骤 3：创建 AppContext.tsx**

```typescript
// src/renderer/src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { SessionSummary, Message, ModelInfo } from '../../../shared/types'

// ============ State ============
interface AppState {
  sessions: SessionSummary[]
  currentSessionId: string | null
  messages: Message[]
  models: ModelInfo[]
  currentModel: string
  isLoading: boolean
  isStreaming: boolean
  streamingMessageId: string | null
  streamingContent: string
  error: string | null
}

const initialState: AppState = {
  sessions: [],
  currentSessionId: null,
  messages: [],
  models: [],
  currentModel: 'claude-sonnet-4-6',
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  streamingContent: '',
  error: null,
}

// ============ Actions ============
type Action =
  | { type: 'SET_SESSIONS'; payload: SessionSummary[] }
  | { type: 'SET_CURRENT_SESSION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_MODELS'; payload: ModelInfo[] }
  | { type: 'SET_CURRENT_MODEL'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'START_STREAMING'; payload: { messageId: string } }
  | { type: 'APPEND_TOKEN'; payload: { token: string; thinking?: string } }
  | { type: 'FINISH_STREAMING' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'REMOVE_SESSION'; payload: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSessionId: action.payload }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'SET_MODELS':
      return { ...state, models: action.payload }
    case 'SET_CURRENT_MODEL':
      return { ...state, currentModel: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'START_STREAMING':
      return {
        ...state,
        isStreaming: true,
        streamingMessageId: action.payload.messageId,
        streamingContent: '',
        error: null,
      }
    case 'APPEND_TOKEN': {
      const token = action.payload.token
      const thinking = action.payload.thinking
      const currentContent = state.streamingContent
      // 先检查是否存在正在流式输出的消息
      const streamingMsgIndex = state.messages.findIndex(
        m => m.id === state.streamingMessageId
      )
      if (streamingMsgIndex >= 0) {
        const updated = [...state.messages]
        const msg = { ...updated[streamingMsgIndex] }
        msg.content = currentContent + token
        if (thinking) msg.thinking = thinking
        updated[streamingMsgIndex] = msg
        return {
          ...state,
          streamingContent: msg.content,
          messages: updated,
        }
      }
      return {
        ...state,
        streamingContent: state.streamingContent + token,
      }
    }
    case 'FINISH_STREAMING':
      return {
        ...state,
        isStreaming: false,
        streamingMessageId: null,
        streamingContent: '',
        error: null,
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isStreaming: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        currentSessionId:
          state.currentSessionId === action.payload ? null : state.currentSessionId,
        messages:
          state.currentSessionId === action.payload ? [] : state.messages,
      }
    default:
      return state
  }
}

// ============ Context ============
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  loadSessions: () => Promise<void>
  switchSession: (sessionId: string) => Promise<void>
  createSession: (name: string, workDir: string) => Promise<void>
  removeSession: (sessionId: string) => Promise<void>
  sendMessage: (content: string) => void
  cancelMessage: () => void
  loadModels: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadSessions = useCallback(async () => {
    const sessions = await window.api.listSessions()
    dispatch({ type: 'SET_SESSIONS', payload: sessions })
  }, [])

  const switchSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId })
    const session = await window.api.getSession(sessionId)
    if (session) {
      dispatch({ type: 'SET_MESSAGES', payload: session.messages })
      if (session.model) {
        dispatch({ type: 'SET_CURRENT_MODEL', payload: session.model })
      }
    }
  }, [])

  const createSession = useCallback(async (name: string, workDir: string) => {
    const session = await window.api.createSession({
      name,
      workDir,
      model: state.currentModel,
    })
    await loadSessions()
    // 自动切换到新会话
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session.id })
    dispatch({ type: 'SET_MESSAGES', payload: [] })
  }, [state.currentModel, loadSessions])

  const removeSession = useCallback(async (sessionId: string) => {
    await window.api.deleteSession(sessionId)
    dispatch({ type: 'REMOVE_SESSION', payload: sessionId })
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!state.currentSessionId || state.isStreaming) return

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const userMessage: Message = {
      id: messageId,
      sessionId: state.currentSessionId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })

    // 添加一个即将流式填充的 assistant 占位消息
    const assistantId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-assistant`
    const assistantPlaceholder: Message = {
      id: assistantId,
      sessionId: state.currentSessionId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: assistantPlaceholder })
    dispatch({ type: 'START_STREAMING', payload: { messageId: assistantId } })

    window.api.sendMessage({
      sessionId: state.currentSessionId,
      message: content,
      model: state.currentModel,
    })
  }, [state.currentSessionId, state.currentModel, state.isStreaming])

  const cancelMessage = useCallback(() => {
    if (state.currentSessionId) {
      window.api.cancelChat(state.currentSessionId)
    }
  }, [state.currentSessionId])

  const loadModels = useCallback(async () => {
    const models = await window.api.getModels()
    dispatch({ type: 'SET_MODELS', payload: models })
  }, [])

  // 监听 IPC 事件
  useEffect(() => {
    const cleanupToken = window.api.onChatToken((data) => {
      dispatch({ type: 'APPEND_TOKEN', payload: { token: data.token, thinking: data.thinking } })
    })

    const cleanupError = window.api.onChatError((data) => {
      dispatch({ type: 'SET_ERROR', payload: data.error })
    })

    const cleanupDone = window.api.onChatDone(() => {
      dispatch({ type: 'FINISH_STREAMING' })
      // 重新加载会话以获取最新消息数
      loadSessions()
    })

    return () => {
      cleanupToken()
      cleanupError()
      cleanupDone()
    }
  }, [loadSessions])

  // 初始化加载
  useEffect(() => {
    loadSessions()
    loadModels()
  }, [loadSessions, loadModels])

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loadSessions,
        switchSession,
        createSession,
        removeSession,
        sendMessage,
        cancelMessage,
        loadModels,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
```

- [ ] **步骤 4：创建 main.tsx**

```typescript
// src/renderer/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './context/AppContext'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
```

- [ ] **步骤 5：测试编译 + 启动**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.web.json 2>&1
```

然后 `npm run dev` 启动验证：
- [ ] 窗口正常显示，无白屏
- [ ] 控制台无 React 渲染报错
- [ ] Context Provider 正常挂载

- [ ] **步骤 6：输出测试文档**

创建 `docs/tests/08-renderer-entry-test.md`，记录编译和启动验证结果。

- [ ] **步骤 7：Commit**

```bash
git add src/renderer/index.html src/renderer/src/main.tsx src/renderer/src/context/AppContext.tsx src/renderer/src/types.d.ts && git commit -m "feat: add renderer entry, global state context"
```

---

### 任务 9：渲染进程 — 侧边栏组件

**文件：**
- 创建：`src/renderer/src/components/Sidebar.tsx`
- 创建：`src/renderer/src/components/SessionList.tsx`
- 创建：`src/renderer/src/components/SessionItem.tsx`
- 创建：`src/renderer/src/components/NewSessionModal.tsx`

- [ ] **步骤 1：创建 SessionItem.tsx**

```tsx
// src/renderer/src/components/SessionItem.tsx
import React from 'react'
import type { SessionSummary } from '../../../../shared/types'

interface Props {
  session: SessionSummary
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export default function SessionItem({ session, isActive, onSelect, onDelete }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定删除会话「${session.name}」？`)) {
      onDelete(session.id)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN')
  }

  return (
    <div
      className={`
        group flex flex-col px-3 py-2.5 cursor-pointer border-b border-gray-700/50
        transition-colors duration-100
        ${isActive ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover'}
      `}
      onClick={() => onSelect(session.id)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{session.name}</span>
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400
                     text-xs px-1 py-0.5 rounded transition-all"
          onClick={handleDelete}
          title="删除会话"
        >
          ✕
        </button>
      </div>
      <span className="text-xs text-gray-500 mt-0.5">
        {session.messageCount} 条消息 · {formatDate(session.updatedAt)}
      </span>
    </div>
  )
}
```

- [ ] **步骤 2：创建 SessionList.tsx**

```tsx
// src/renderer/src/components/SessionList.tsx
import React from 'react'
import SessionItem from './SessionItem'
import { useAppContext } from '../context/AppContext'

export default function SessionList() {
  const { state, switchSession, removeSession } = useAppContext()

  if (state.sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-gray-400 text-sm">暂无会话</p>
        <p className="text-gray-600 text-xs mt-1">点击上方 + 创建第一个会话</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {state.sessions.map((s) => (
        <SessionItem
          key={s.id}
          session={s}
          isActive={s.id === state.currentSessionId}
          onSelect={switchSession}
          onDelete={removeSession}
        />
      ))}
    </div>
  )
}
```

- [ ] **步骤 3：创建 NewSessionModal.tsx**

```tsx
// src/renderer/src/components/NewSessionModal.tsx
import React, { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, workDir: string) => void
}

export default function NewSessionModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [workDir, setWorkDir] = useState('')

  if (!isOpen) return null

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim(), workDir.trim() || process.cwd?.() || '.')
    setName('')
    setWorkDir('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-sidebar rounded-lg shadow-xl w-[420px] p-6"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-lg font-semibold mb-4">新建会话</h2>

        <label className="block text-sm text-gray-400 mb-1">会话名称</label>
        <input
          type="text"
          className="w-full bg-input border border-gray-600 rounded px-3 py-2 text-sm
                     focus:outline-none focus:border-accent mb-4"
          placeholder="例如：前端Bug修复"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label className="block text-sm text-gray-400 mb-1">工作目录（可选）</label>
        <input
          type="text"
          className="w-full bg-input border border-gray-600 rounded px-3 py-2 text-sm
                     focus:outline-none focus:border-accent mb-6"
          placeholder="留空使用当前目录"
          value={workDir}
          onChange={(e) => setWorkDir(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm rounded bg-accent hover:bg-blue-500 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **步骤 4：创建 Sidebar.tsx**

```tsx
// src/renderer/src/components/Sidebar.tsx
import React, { useState } from 'react'
import SessionList from './SessionList'
import NewSessionModal from './NewSessionModal'
import { useAppContext } from '../context/AppContext'

export default function Sidebar() {
  const [showModal, setShowModal] = useState(false)
  const { createSession } = useAppContext()

  return (
    <>
      <div className="flex flex-col h-full bg-sidebar w-[280px] min-w-[200px] border-r border-gray-700/50">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h1 className="text-sm font-semibold tracking-wide">Claude Code</h1>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md
                       hover:bg-sidebar-hover transition-colors text-lg text-gray-300"
            onClick={() => setShowModal(true)}
            title="新建会话"
          >
            +
          </button>
        </div>

        {/* 会话列表 */}
        <SessionList />
      </div>

      <NewSessionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={createSession}
      />
    </>
  )
}
```

- [ ] **步骤 5：功能测试**

启动 `npm run dev`：

**侧边栏功能测试：**
- [ ] 左侧边栏显示 "Claude Code" 标题
- [ ] 点击 "+" 按钮弹出新建会话弹窗
- [ ] 输入会话名称 → 点击创建 → 会话出现在列表
- [ ] 空名称时创建按钮禁用
- [ ] 按 Esc 关闭弹窗
- [ ] 多个会话按更新时间排序
- [ ] 悬停会话条目显示删除按钮
- [ ] 点击删除 → 弹窗确认 → 会话移除

- [ ] **步骤 6：输出测试文档**

创建 `docs/tests/09-sidebar-test.md`，将上述每个检查项逐一记录结果。

- [ ] **步骤 7：Commit**

```bash
git add src/renderer/src/components/Sidebar.tsx src/renderer/src/components/SessionList.tsx src/renderer/src/components/SessionItem.tsx src/renderer/src/components/NewSessionModal.tsx && git commit -m "feat: implement sidebar with session list and new session modal"
```

---

### 任务 10：渲染进程 — 聊天视图组件

**文件：**
- 创建：`src/renderer/src/components/ChatView.tsx`
- 创建：`src/renderer/src/components/MessageBubble.tsx`
- 创建：`src/renderer/src/components/CodeBlock.tsx`

- [ ] **步骤 1：创建 CodeBlock.tsx**

```tsx
// src/renderer/src/components/CodeBlock.tsx
import React, { useState } from 'react'

interface Props {
  language: string
  code: string
}

export default function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-700">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/80">
        <span className="text-xs text-gray-400">{language || 'code'}</span>
        <button
          className="text-xs px-2 py-0.5 rounded hover:bg-gray-700 transition-colors
                     text-gray-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
      {/* 代码内容 */}
      <pre className="px-3 py-2.5 text-sm overflow-x-auto bg-gray-900/50 font-mono
                       leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}
```

- [ ] **步骤 2：创建 MessageBubble.tsx**

```tsx
// src/renderer/src/components/MessageBubble.tsx
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CodeBlock from './CodeBlock'
import type { Message } from '../../../../shared/types'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const [thinkingExpanded, setThinkingExpanded] = useState(false)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-bubble-user text-white rounded-br-md'
            : 'bg-bubble-assistant text-gray-100 rounded-bl-md'
        }`}
      >
        {/* 思考块 */}
        {message.thinking && (
          <div className="mb-2">
            <button
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300
                         transition-colors mb-1"
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
            >
              <span>{thinkingExpanded ? '▼' : '▶'}</span>
              <span>思考过程</span>
            </button>
            {thinkingExpanded && (
              <div className="text-xs text-gray-400 bg-black/20 rounded-lg px-3 py-2
                              border-l-2 border-gray-500 italic">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* 消息内容 — Markdown 渲染 */}
        <div className="prose prose-invert prose-sm max-w-none break-words">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const codeStr = String(children).replace(/\n$/, '')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isInline = !match && !codeStr.includes('\n')
                if (isInline) {
                  return (
                    <code className="bg-black/30 rounded px-1.5 py-0.5 text-xs" {...props}>
                      {children}
                    </code>
                  )
                }
                return <CodeBlock language={match?.[1] || ''} code={codeStr} />
              },
              pre({ children }) {
                return <>{children}</>
              },
            }}
          >
            {message.content || (message.role === 'assistant' ? '▊' : '')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **步骤 3：创建 ChatView.tsx**

```tsx
// src/renderer/src/components/ChatView.tsx
import React, { useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import { useAppContext } from '../context/AppContext'

export default function ChatView() {
  const { state } = useAppContext()
  const bottomRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.streamingContent])

  if (state.messages.length === 0 && !state.isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-xl font-semibold mb-2">Claude Code Desktop</h2>
        <p className="text-gray-400 text-sm max-w-md">
          在下方输入消息开始对话。选择左侧会话或新建一个会话。
        </p>
        <div className="mt-6 flex gap-2 text-xs text-gray-600">
          <kbd className="px-2 py-1 bg-sidebar rounded">Enter</kbd>
          <span className="self-center">发送</span>
          <kbd className="px-2 py-1 bg-sidebar rounded">Shift+Enter</kbd>
          <span className="self-center">换行</span>
          <kbd className="px-2 py-1 bg-sidebar rounded">Esc</kbd>
          <span className="self-center">取消</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {state.messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* 错误提示 */}
      {state.error && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800/50
                        text-red-300 text-sm">
          ⚠ {state.error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **步骤 4：功能测试**

启动 `npm run dev`：

**聊天视图功能测试：**
- [ ] 无消息时显示空状态引导页
- [ ] 空状态显示快捷键提示 (Enter/Shift+Enter/Esc)
- [ ] 消息按发送顺序从上到下排列
- [ ] 用户消息右对齐（蓝色气泡）
- [ ] AI 消息左对齐（灰色气泡）
- [ ] 消息自动滚动到底部
- [ ] 代码块可点击复制按钮，复制后显示 "已复制 ✓"
- [ ] Markdown 渲染正常（标题、列表、粗体、代码）
- [ ] 思考过程可折叠/展开

- [ ] **步骤 5：输出测试文档**

创建 `docs/tests/10-chat-view-test.md`，将上述每个检查项逐一记录。

- [ ] **步骤 6：Commit**

```bash
git add src/renderer/src/components/ChatView.tsx src/renderer/src/components/MessageBubble.tsx src/renderer/src/components/CodeBlock.tsx && git commit -m "feat: implement chat view with markdown, code blocks, streaming"
```

---

### 任务 11：渲染进程 — 输入区域 + 模型选择

**文件：**
- 创建：`src/renderer/src/components/InputArea.tsx`
- 创建：`src/renderer/src/components/ModelSelect.tsx`

- [ ] **步骤 1：创建 ModelSelect.tsx**

```tsx
// src/renderer/src/components/ModelSelect.tsx
import React from 'react'
import { useAppContext } from '../context/AppContext'

export default function ModelSelect() {
  const { state, dispatch } = useAppContext()

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">模型:</span>
      <select
        className="bg-input border border-gray-600 rounded px-2 py-1 text-xs
                   focus:outline-none focus:border-accent cursor-pointer"
        value={state.currentModel}
        onChange={(e) => dispatch({ type: 'SET_CURRENT_MODEL', payload: e.target.value })}
      >
        {state.models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **步骤 2：创建 InputArea.tsx**

```tsx
// src/renderer/src/components/InputArea.tsx
import React, { useState, useRef } from 'react'
import ModelSelect from './ModelSelect'
import { useAppContext } from '../context/AppContext'

export default function InputArea() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { state, sendMessage, cancelMessage } = useAppContext()

  // 如果没有选中会话，不显示输入区
  if (!state.currentSessionId) return null

  const handleSend = () => {
    const content = input.trim()
    if (!content || state.isStreaming) return
    sendMessage(content)
    setInput('')
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && state.isStreaming) {
      cancelMessage()
    }
  }

  // 自动调整 textarea 高度
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-gray-700/50 px-4 py-3 bg-main">
      {/* 输入框 */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-input border border-gray-600 rounded-xl px-4 py-2.5 text-sm
                     resize-none focus:outline-none focus:border-accent transition-colors
                     placeholder-gray-500 max-h-[200px]"
          placeholder={state.isStreaming ? 'Claude 正在生成...' : '输入消息...'}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={state.isStreaming}
        />
        {state.isStreaming ? (
          <button
            className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-sm
                       transition-colors font-medium"
            onClick={cancelMessage}
          >
            停止
          </button>
        ) : (
          <button
            className="px-4 py-2.5 rounded-xl bg-accent hover:bg-blue-500 text-sm
                       transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            发送
          </button>
        )}
      </div>

      {/* 底部信息栏 */}
      <div className="flex items-center justify-between mt-2 px-1">
        <ModelSelect />
      </div>
    </div>
  )
}
```

- [ ] **步骤 3：功能测试**

启动 `npm run dev`：

**输入区域功能测试：**
- [ ] 未选中会话时不显示输入区
- [ ] 选中会话后输入区正常显示
- [ ] 空输入时发送按钮禁用
- [ ] Enter 键发送消息
- [ ] Shift+Enter 换行
- [ ] 多行输入时 textarea 自动增高

**模型切换功能测试：**
- [ ] 模型下拉列表显示 4 个模型
- [ ] 默认选中 Sonnet 4.6
- [ ] 切换到其他模型 → 下拉值更新
- [ ] 模型参数在底部栏正确显示

- [ ] **步骤 4：输出测试文档**

创建 `docs/tests/11-input-model-test.md`，将上述每项逐一记录。

- [ ] **步骤 5：Commit**

```bash
git add src/renderer/src/components/InputArea.tsx src/renderer/src/components/ModelSelect.tsx && git commit -m "feat: implement input area with model selector"
```

---

### 任务 12：渲染进程 — App 根组件 + 全局样式

**文件：**
- 创建：`src/renderer/src/App.tsx`
- 创建：`src/renderer/src/styles/index.css`

- [ ] **步骤 1：创建 index.css**

```css
/* Tailwind CSS 4 */
@import "tailwindcss";

/* Scrollbar 样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #4a4b50;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #5a5b60;
}

/* 全局 */
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

- [ ] **步骤 2：创建 App.tsx**

```tsx
// src/renderer/src/App.tsx
import React from 'react'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import InputArea from './components/InputArea'

export default function App() {
  return (
    <div className="flex h-screen bg-main text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView />
        <InputArea />
      </div>
    </div>
  )
}
```

- [ ] **步骤 3：集成功能测试**

启动 `npm run dev`：

**全功能回归测试（三个核心功能）：**

| # | 功能 | 测试步骤 | 预期结果 |
|---|------|---------|---------|
| 1 | GUI 聊天 | 创建会话 → 输入消息 → 发送 | 消息出现在聊天区，Claude 流式回复 |
| 2 | 模型切换 | 选择不同模型 → 发送消息 | 新模型生效，下拉框显示切换后的模型 |
| 3 | 会话切换 | 创建多个会话 → 点击侧栏切换 | 聊天区切换为对应会话的消息历史 |

**边界场景：**
- [ ] 快速连续发送多条消息（队列处理）
- [ ] 在 AI 回复中切换会话（不影响当前生成）
- [ ] 删除当前选中会话（UI 正确回退）
- [ ] 粘贴长文本输入

- [ ] **步骤 4：输出测试文档**

创建 `docs/tests/12-integration-test.md`，记录完整的端到端测试结果。

- [ ] **步骤 5：Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/styles/index.css && git commit -m "feat: wire up App layout with sidebar, chat view, and input area"
```

---

### 任务 13：最终验证与修复

- [ ] **步骤 1：检查 TypeScript 编译**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json 2>&1 && npx tsc --noEmit -p tsconfig.web.json 2>&1
```

预期：两个 tsconfig 都无类型错误。

- [ ] **步骤 2：启动开发模式验证**

```bash
cd D:/project/claude/desktop && npm run dev
```

- [ ] **步骤 3：完整回归测试**

按任务 12 的功能回归表格逐项验证，确保三个核心功能全部通过。

- [ ] **步骤 4：修复发现的问题**

修复所有不通过的功能点，修复后重新测试确认。

- [ ] **步骤 5：输出最终测试汇总**

创建 `docs/tests/13-summary-test.md`，汇总任务 1-12 的所有测试文档路径和通过情况。

- [ ] **步骤 6：最终 Commit**

```bash
git add -A && git commit -m "fix: final verification fixes"
```
