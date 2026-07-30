# CLAUDE.md — Claude Code Desktop

## 项目概述

实现一个 Claude Code CLI 的桌面 GUI 客户端。免费、开源，通过 `node-pty` 管理本地 `claude` CLI 进程进行通信。

## 技术栈

- **桌面框架**: Electron 34
- **前端**: React 19 + TypeScript 5.7
- **构建**: electron-vite
- **样式**: Tailwind CSS 4 + Radix UI (无头组件)
- **终端管理**: node-pty (管理 Claude CLI 进程)
- **状态管理**: React Context + useReducer
- **持久化**: 本地 JSON 文件 (`~/.claude-code-desktop/sessions/`)

## 开发命令

```bash
npm install              # 安装依赖
npm run dev              # 启动开发模式 (热更新)
npm run build            # 生产构建
npm run preview          # 预览构建结果
```

## 项目结构

```
src/
├── shared/types.ts           # 共享类型定义 (IPC 通道、Session、Message等)
├── main/                     # Electron 主进程
│   ├── index.ts              # 入口: 窗口创建 + IPC 注册
│   ├── claude-manager.ts     # node-pty 进程管理 (Map<sessionId, IPty>)
│   ├── session-store.ts      # 会话 CRUD + JSON 持久化
│   ├── config-manager.ts     # 配置管理 (模型列表、用户设置)
│   ├── ipc-handlers.ts       # 所有 IPC 通道的 handler 注册
│   └── path-utils.ts         # 路径工具 (getAppDataDir等)
├── preload/index.ts          # contextBridge 暴露安全 API
└── renderer/                 # React 渲染进程
    ├── index.html
    └── src/
        ├── main.tsx          # ReactDOM.createRoot
        ├── App.tsx           # 根布局 (Sidebar + MainContent)
        ├── context/AppContext.tsx  # 全局状态
        ├── hooks/            # 自定义 hooks
        └── components/       # UI 组件
```

## 核心架构决策

1. **CLI 直连, 不用 API**: 通过 node-pty 启动本地的 `claude` 命令, stdin/stdout 通信。利用用户已有的 Claude CLI 配置和认证。

2. **每条消息启动一个 CLI 进程**: 不是长连接 —— 用户发一条消息, 启动 `claude -p "..." --model xxx`, 读取完整输出, 进程退出。这样更可靠, 把会话连续性交给 CLI 自己管理 (通过 `--continue` 标志)。

3. **JSONL 持久化**: 每条消息存为一行 JSON, 追加写入。不使用 SQLite/IndexedDB, 保持简单。

4. **流式输出**: 逐行读取 pty stdout, 实时推送到渲染进程显示。

5. **无文件监听 MVP**: 第一期不依赖 chokidar 监听 .jsonl 变化, 所有数据流都通过 IPC。

## IPC 通道命名规范

- `session:*` — 会话管理 (list/create/get/delete)
- `chat:*` — 聊天控制 (send/cancel) 和事件 (token/error/done)
- `config:*` — 配置读取 (get-models/get-settings/update-settings)
- `app:*` — 应用级操作 (get-app-info/open-external)

## 参考项目

- Claude Code CLI 文档: https://docs.anthropic.com/en/docs/claude-code

## 测试要求

- **每个功能点完成后必须输出测试文档** — 创建 `docs/tests/<feature-name>-test.md`
- 测试文档包含: 测试内容、预期结果、实际结果、是否通过
- 测试形式: 手动功能测试 (启动应用 → 操作步骤 → 观察结果)
- 不通过的功能点必须立即修复，修复后重新测试
- 不要在全部功能完成后再统一测试 — 边做边测

## 修复记录

- **每次用户反馈的 bug 修复必须记录文档** — 创建或追加 `docs/fixes/<日期>-fixes.md`
- 修复文档包含: 问题描述、根因、修复方案、涉及文件、验证结果
- 与测试文档分开管理

## 代码风格

- TypeScript strict mode
- 主进程: async/await + try/catch 错误处理
- 渲染进程: React functional components + hooks
- IPC 通信: 统一通过 preload 暴露的 `window.api` 对象
- 文件命名: kebab-case
- 组件文件: PascalCase.tsx

## AI 协作纪律

- **禁止重复构建验证**：修改代码后只跑一次 `npx tsc --noEmit` + `npx electron-vite build` 确认编译通过。如果 git status 无变化且上次构建已通过，不要再重复构建。不要在无新增改动的情况下多次 commit "chore" "noop" 等空提交
- **禁止死循环**：当一个操作连续执行多次且结果完全相同时（如连续 build 结果一致、连续 git status 显示 clean），立即停止，问用户下一步做什么
- **变更完成后不要 commit**：一次改动 → 一次构建，不需要 git commit
