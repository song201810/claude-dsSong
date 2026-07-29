# Claude Code Desktop — 架构设计文档

## 项目定位

实现一个 Claude Code CLI 的桌面 GUI 客户端。免费、开源，通过本地 `claude` CLI 进程与 Claude 通信。

## 技术栈

| 层级 | 技术 | 理由 |
|------|------|------|
| 桌面框架 | Electron 34 | 跨平台、成熟生态、可直接调用 Node.js API |
| 前端框架 | React 19 + TypeScript 5.7 | 生态最成熟 |
| 构建工具 | electron-vite | Electron 专用构建方案，热更新快 |
| 样式方案 | Tailwind CSS 4 + Radix UI | 快速出活、样式灵活、无头组件 |
| 终端模拟 | node-pty | 伪终端管理 Claude CLI 进程 |
| 文件监听 | chokidar | 监听 `.jsonl` 会话文件变化 |
| 代码高亮 | Monaco Editor (精简) 或 Prism.js | 对话中的代码块着色 |
| 状态管理 | React Context + useReducer | 规模可控，不需要 Redux |
| 持久化 | 本地 JSON 文件 (`~/.claude-code-desktop/`) | 轻量、无外部依赖 |

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   Electron 主进程                        │
│                                                         │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Claude Manager │  │ Session Store │  │ File Watcher│  │
│  │  (node-pty)    │  │ (JSON 文件)   │  │ (chokidar)  │  │
│  │                │  │               │  │ 监听.jsonl  │  │
│  │ - 启停 CLI     │  │ - CRUD 会话   │  │ 实时同步    │  │
│  │ - stdin/stdout │  │ - 会话元数据  │  │             │  │
│  │ - 信号控制     │  │ - 消息列表    │  │             │  │
│  └───────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│          │                 │                  │          │
│  ┌───────┴─────────────────┴──────────────────┴───────┐  │
│  │              IPC Bridge (contextBridge)             │  │
│  │  preload.ts: 安全的 API 暴露给渲染进程               │  │
│  └──────────────────────┬─────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│           Electron 渲染进程 (React 19 + Tailwind)        │
│                          │                               │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │               AppContext (全局状态)                  │  │
│  │  sessions / currentSession / currentModel          │  │
│  └────┬──────────────┬──────────────┬────────────────┘  │
│       │              │              │                    │
│  ┌────┴──────┐ ┌─────┴─────┐ ┌─────┴──────┐            │
│  │ ChatList  │ │ ChatView  │ │ ModelSelect│            │
│  │ (侧边栏)   │ │ (主区域)   │ │ (顶部栏)   │            │
│  └───────────┘ └───────────┘ └────────────┘            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Components (可复用组件)                │  │
│  │  MessageBubble / CodeBlock / ToolCallCard          │  │
│  │  SessionItem / InputArea / DiffView                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 核心数据流

### 1. 聊天消息流

```
用户输入 → InputArea (React)
  → IPC: 'chat:send' { sessionId, message, model }
    → Claude Manager (main process)
      → node-pty 写入 claude CLI stdin
        → Claude CLI 处理
      → node-pty stdout 读取响应
        → 解析消息 token (JSONL 格式)
    → IPC: 'chat:token' { sessionId, token }
  → ChatView 追加显示 (React)
```

### 2. 会话管理流

```
应用启动
  → Session Store 扫描 ~/.claude-code-desktop/sessions/
  → 加载所有会话元数据
  → IPC: 'session:list' → 渲染进程显示会话列表

用户新建会话
  → 渲染进程: 收集名称 + 工作目录
  → IPC: 'session:create' { name, workDir }
  → Session Store: 创建 session 目录 + metadata.json
  → File Watcher: 开始监听 .jsonl 文件
  → 渲染进程更新会话列表

用户切换会话
  → 渲染进程: 选中新会话
  → IPC: 'session:load' { sessionId }
  → Session Store: 读取消息历史
  → 渲染进程: 更新 ChatView
```

### 3. 模型切换流

```
用户选择模型 → ModelSelect (React)
  → 更新 AppContext.currentModel
  → 后续 chat:send 携带新模型参数
  → Claude Manager: 启动 CLI 时传递 --model 参数
```

## 主进程模块设计

### Claude Manager (`src/main/claude-manager.ts`)

```
职责: 管理 Claude CLI 进程的生命周期

接口:
  start(sessionId, config)  → 启动 pty 进程
  stop(sessionId)           → 终止进程
  send(sessionId, message)  → 写入 stdin
  getStatus(sessionId)      → 查询进程状态

内部:
  - Map<sessionId, IPty> 进程池
  - stdout 解析器: 按行分割, 识别 JSONL 消息
  - 错误处理: 进程崩溃自动重启 (最多 3 次)
  - 信号处理: SIGINT → 取消当前生成
```

### Session Store (`src/main/session-store.ts`)

```
职责: 会话和消息的持久化存储

接口:
  list()                     → 所有会话摘要
  create(name, workDir)     → 新建会话
  get(sessionId)            → 会话详情 + 消息历史
  delete(sessionId)         → 删除会话
  appendMessage(sessionId, msg) → 追加一条消息
  getMessages(sessionId)    → 获取消息列表

存储结构:
  ~/.claude-code-desktop/
    sessions/
      <session-id>/
        metadata.json     → { id, name, createdAt, model, workDir }
        messages.jsonl    → 每行一条消息 (JSON)
    settings.json         → 用户偏好设置
```

### File Watcher (`src/main/file-watcher.ts`)

```
职责: 监听会话文件变化, 通知渲染进程

接口:
  watch(sessionId)    → 开始监听
  unwatch(sessionId)  → 停止监听

实现:
  - chokidar 监听 messages.jsonl
  - 检测新行追加 (尾行读取, 避免全量)
  - IPC 推送: 'session:updated' { sessionId, newMessages }
```

### Config Manager (`src/main/config-manager.ts`)

```
职责: 读取和管理 Claude CLI 配置

接口:
  getModels()          → 可用模型列表及其参数
  getSettings()        → 用户偏好
  updateSettings(partial) → 更新设置

默认模型列表:
  - claude-opus-4-8    (Opus 4.8, 最强)
  - claude-sonnet-4-6  (Sonnet 4.6, 平衡)
  - claude-haiku-4-5-20251001 (Haiku 4.5, 快速)
  - claude-fable-5     (Fable 5, 最新)
```

## 渲染进程组件树

```
App
├── AppProvider (Context + useReducer)
│   ├── TitleBar (自定义标题栏, 可选)
│   ├── MainLayout
│   │   ├── Sidebar (左侧栏, 宽度 ~280px)
│   │   │   ├── SidebarHeader
│   │   │   │   ├── NewSessionButton (+ 新建会话)
│   │   │   │   └── SearchInput (会话搜索, 可选)
│   │   │   └── SessionList
│   │   │       └── SessionItem × N
│   │   │           ├── SessionName
│   │   │           ├── SessionPreview (最后一条消息)
│   │   │           ├── SessionDate
│   │   │           └── DeleteButton
│   │   └── MainContent (右侧主区域)
│   │       ├── ChatHeader
│   │       │   ├── SessionTitle
│   │       │   ├── WorkDirBadge
│   │       │   └── ModelSelect (模型下拉)
│   │       ├── ChatView (消息列表, 可滚动)
│   │       │   ├── EmptyState (无消息时)
│   │       │   └── MessageBubble × N
│   │       │       ├── UserMessage
│   │       │       └── AssistantMessage
│   │       │           ├── ThinkingBlock (折叠)
│   │       │           ├── TextContent (Markdown)
│   │       │           ├── CodeBlock (语法高亮 + 复制)
│   │       │           └── ToolCallCard
│   │       │               ├── ToolName + Status
│   │       │               ├── ToolInput (折叠)
│   │       │               └── ToolOutput (折叠)
│   │       └── InputArea (底部, 固定)
│   │           ├── ContextBar (附件/文件引用)
│   │           ├── TextInput (多行文本框)
│   │           ├── ModelSwitcher (快捷切换)
│   │           └── SendButton (发送)
│   └── SettingsModal (设置弹窗, 可选)
│       ├── ModelConfig
│       ├── ThemeConfig
│       └── AboutInfo
```

## 功能范围


## UI 布局设计

```
┌─────────────────────────────────────────────────────────┐
│  Claude Code Desktop                          [─][□][×] │
├────────────┬────────────────────────────────────────────┤
│            │  ChatHeader: 当前会话名    [模型选择: Opus ▼] │
│  Sidebar   ├────────────────────────────────────────────┤
│            │                                            │
│  [+ 新建]  │  ChatView (消息列表)                         │
│            │                                            │
│  ┌──────┐  │  ┌──────────────────────────────────────┐  │
│  │会话 1 │  │  │ 🤖 你好，我是 Claude...              │  │
│  │预览.. │  │  │ (Markdown 渲染, 代码块高亮)           │  │
│  └──────┘  │  └──────────────────────────────────────┘  │
│  ┌──────┐  │                                            │
│  │会话 2 │  │  ┌──────────────────────────────────────┐  │
│  │预览.. │  │  │ 👤 帮我写个函数                       │  │
│  └──────┘  │  └──────────────────────────────────────┘  │
│  ┌──────┐  │                                            │
│  │会话 3 │  │                                            │
│  └──────┘  ├────────────────────────────────────────────┤
│            │  InputArea: [输入框.................] [发送] │
│            │  模型: [Sonnet 4.6 ▼]  工作目录: /project   │
└────────────┴────────────────────────────────────────────┘
```

### 关键交互行为

| 交互 | 行为 |
|------|------|
| Enter | 发送消息 |
| Shift+Enter | 输入框内换行 |
| Esc | 取消当前 AI 生成 |
| 侧栏宽度 | 可拖拽调整（默认 ~260px） |
| 新建会话 | 弹出 Modal：输入"会话名称" + "工作目录" |
| 模型切换 | 下拉菜单切换，新消息生效 |
| 消息滚动 | 流式输出时自动平滑跟随底部 |
| 会话切换 | 点击侧栏会话 → 加载该会话的消息历史 |

### 组件状态设计

```
新建会话按钮 ──点击──→ NewSessionModal (名称 + 工作目录)
                    ├── 确认 → 创建 Session → 关闭弹窗 → 刷新列表
                    └── 取消 → 关闭弹窗

发送消息 ──点击/Enter──→ 消息加入 ChatView (user bubble)
                      ├── IPC → 主进程启动 CLI
                      ├── 流式返回 → MessageBubble 逐步追加
                      ├── 完成 → 'chat:done' → 气泡状态: done
                      └── 取消 → 'chat:cancel' → 气泡状态: cancelled

模型切换 ──选择──→ AppContext.model 更新
                └── 下次发送时携带 --model 参数

会话切换 ──点击──→ currentSessionId 更新
                ├── IPC 加载消息历史
                └── ChatView 刷新
```

## 功能范围

### MVP 核心功能 (必须实现)

| 功能 | 描述 | 优先级 |
|------|------|--------|
| GUI 聊天 | 输入消息 → 流式显示 Claude 回复 | P0 |
| 模型切换 | 下拉选择模型, 新消息生效 | P0 |
| 会话列表 | 侧栏显示历史会话, 点击切换 | P0 |
| 新建会话 | 创建新会话, 设置名称和工作目录 | P0 |
| 会话消息持久化 | 消息存为 JSONL, 重启不丢失 | P0 |
| 流式消息显示 | 逐 token 显示响应, 不等待完整结果 | P0 |
| 消息格式化 | Markdown 渲染 (标题/列表/粗体/代码) | P0 |
| 代码块高亮 | 代码块语法高亮 + 复制按钮 | P0 |
| 取消发送 | 停止当前 AI 生成 (Ctrl+C → pty) | P0 |

### 明确放弃的功能 (留给 V2)

| 功能 | 放弃理由 |
|------|----------|
| 终端集成 (xterm.js) | MVP 只需要聊天界面, CLI 在后台运行即可 |
| 代码变更 Diff 查看 | 需要 Monaco Editor + 复杂 diff 逻辑, 非核心 |
| @file 文件引用 | Claude CLI 本身支持, GUI 层面非必须 |
| 多国际化 | 先只做中文, 后面按需添加 |
| 图片上传 | 非核心聊天功能 |
| 主题切换 (暖色/浅色/深色) | 先做深色一种, 后续加 |
| 权限弹窗 (Allow/Deny) | Claude CLI 在后台自行处理, 暂不拦截 |
| 设置面板 | 手动编辑配置文件, MVP 不需要 GUI |

## 文件结构

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
├── CLAUDE.md                    # AI 协作指引
│
├── src/
│   ├── shared/                  # 主进程/渲染进程共享
│   │   └── types.ts             # IPC 通道定义、消息类型、会话类型
│   │
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口: 创建窗口、注册 IPC
│   │   ├── claude-manager.ts    # node-pty 进程管理
│   │   ├── session-store.ts     # 会话 CRUD + JSON 文件读写
│   │   ├── config-manager.ts    # 配置读取 (模型列表、设置)
│   │   ├── ipc-handlers.ts      # IPC 通道注册和处理
│   │   └── path-utils.ts        # 路径解析工具
│   │
│   ├── preload/                 # Preload 脚本
│   │   └── index.ts             # contextBridge 暴露 API
│   │
│   └── renderer/                # React 渲染进程
│       ├── index.html
│       └── src/
│           ├── main.tsx         # React 入口
│           ├── App.tsx          # 根组件 + 布局
│           ├── context/
│           │   └── AppContext.tsx  # 全局状态 (sessions, currentSession, model)
│           ├── hooks/
│           │   ├── useIpc.ts        # IPC 调用封装
│           │   ├── useSessions.ts   # 会话列表逻辑
│           │   └── useChat.ts       # 聊天消息流处理
│           ├── components/
│           │   ├── Sidebar.tsx      # 侧边栏容器
│           │   ├── SessionList.tsx  # 会话列表
│           │   ├── SessionItem.tsx  # 单个会话条目
│           │   ├── ChatView.tsx     # 聊天消息列表
│           │   ├── MessageBubble.tsx # 消息气泡
│           │   ├── CodeBlock.tsx    # 代码块 (高亮+复制)
│           │   ├── InputArea.tsx    # 输入区域
│           │   ├── ModelSelect.tsx  # 模型选择下拉
│           │   └── NewSessionModal.tsx # 新建会话弹窗
│           └── styles/
│               └── index.css    # Tailwind 指令 + 全局样式
│
└── resources/                   # 应用图标等静态资源
    └── icon.png
```

## 数据模型

### 文件存储结构

```
~/.claude-code-desktop/
├── settings.json              # 全局设置 (模型列表、默认模型)
│
├── sessions/
│   ├── <uuid-1>/
│   │   ├── metadata.json      # 会话元数据
│   │   └── messages.jsonl     # 消息记录 (每行一条 JSON)
│   ├── <uuid-2>/
│   │   ├── metadata.json
│   │   └── messages.jsonl
│   └── ...
```

### metadata.json

```json
{
  "id": "a1b2c3d4-...",
  "name": "前端Bug修复",
  "workDir": "/Users/song/my-project",
  "model": "claude-sonnet-4-6",
  "createdAt": "2026-07-29T10:00:00.000Z",
  "updatedAt": "2026-07-29T11:30:00.000Z",
  "messageCount": 8
}
```

### messages.jsonl (逐行追加)

```jsonl
{"id":"msg-1","role":"user","content":"帮我写个排序函数","timestamp":"2026-07-29T10:00:00Z"}
{"id":"msg-2","role":"assistant","content":"这是冒泡排序：\n```js\nfunction sort(arr) {...}\n```","thinking":"用户要排序函数，选冒泡因为简单","timestamp":"2026-07-29T10:00:05Z"}
```

### 会话生命周期

```
[新建] ──发送消息──→ [活跃: 有消息] ──继续对话──→ [活跃]
                       │
                       ├── 删除 ──→ [移除: 删除会话目录]
                       └── 清空 ──→ [重置: 清空 messages.jsonl]
```

### CLI 调用策略

```
每条消息 → 启动独立 CLI 进程:
  claude -p "<用户消息>" --model <model> [--continue]

  - 首条消息: 不带 --continue，CLI 自动创建新 session
  - 后续消息: 带 --continue，CLI 自动加载上次上下文

进程生命周期:
  start() → 写入 stdin → 逐行读取 stdout → 进程退出 → done

取消操作:
  process.kill(pid, 'SIGINT') → 进程收到信号后退出
```

## 主动放弃与取舍

1. **放弃 xterm.js 终端集成**：MVP 只做聊天界面。Claude CLI 在后台通过 pty 运行，用户不需要看到原始终端输出。这大幅简化了 UI 复杂度。
2. **放弃外部数据库**：用本地 JSON 文件而非 SQLite/IndexedDB。三个功能的规模用 JSON 文件足够，调试方便，schema 变更灵活。
3. **放弃 CI/CD 和自动打包**：MVP 阶段手动 `npm run build` 即可。配置 GitHub Actions 打包 Win/Mac/Linux 安装包是发行阶段的事情。
4. **放弃国际化**：先做中文界面，字符串不抽成 i18n key。后续加国际化时再统一改造。
6. **放弃权限拦截 GUI**：Claude CLI 的权限询问（Allow/Deny）在 pty 层面自动回复 Allow，权限管理留给后续版本。

## IPC 通道设计

```typescript
// src/shared/types.ts

// 会话相关
'session:list'              → () => SessionSummary[]
'session:create'            → (params: CreateSessionParams) => Session
'session:get'               → (id: string) => Session
'session:delete'            → (id: string) => void

// 聊天相关
'chat:send'                 → (params: SendMessageParams) => void
'chat:cancel'               → (sessionId: string) => void
'chat:token'                → (data: ChatTokenEvent) => void    // 主→渲染
'chat:error'                → (data: ChatErrorEvent) => void    // 主→渲染
'chat:done'                 → (data: ChatDoneEvent) => void     // 主→渲染

// 配置相关
'config:get-models'         → () => ModelInfo[]
'config:get-settings'       → () => Settings
'config:update-settings'    → (partial: Partial<Settings>) => void
```

## 消息类型定义

```typescript
interface Session {
  id: string;
  name: string;
  workDir: string;
  model: string;
  createdAt: string;  // ISO 8601
  updatedAt: string;
  messageCount: number;
}

interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  // assistant 消息可能有额外字段
  thinking?: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface ModelInfo {
  id: string;        // e.g. 'claude-sonnet-4-6'
  name: string;      // e.g. 'Claude Sonnet 4.6'
  description: string;
}
```

---

> 设计文档版本: v1.0 | 日期: 2026-07-29
