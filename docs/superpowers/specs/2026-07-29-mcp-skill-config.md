# MCP 配置功能 — 需求文档

**日期：** 2026-07-29（更新 2026-07-30）  
**状态：** ✅ 已实现 (2026-07-30)

## 功能概述

1. 用户可通过 GUI 管理 MCP 服务器配置
2. 每个会话可动态选择启用哪些 MCP 服务
3. MCP 工具调用前需用户确认（弹窗 approve/deny）

## 核心功能

### 1. MCP 配置管理

- 读取多个来源的 MCP 服务器：`~/.claude/.mcp.json`、插件目录的 `.mcp.json`、`~/.claude/.credentials.json` 中的 OAuth MCP
- GUI 展示 MCP 服务器列表，支持新增/编辑/删除 (写入 `~/.claude/.mcp.json`)

### 2. 会话级 MCP 服务选择

- 每个会话可独立选择启用哪些 MCP 服务器（生成临时 `--mcp-config` 文件传给 CLI）
- 切换会话时 MCP 选择随之切换

### 3. 工具调用确认弹窗

- Claude 调用 MCP 工具前，拦截并弹出确认窗口
- 显示：工具名称、所属 MCP 服务、参数内容
- 用户选项：允许一次 / 允许全部 / 拒绝
- "允许全部"表示本次会话中该工具不再询问

## 待确认问题

- ~~MCP 选择入口放在哪里？~~ → **A: 输入区旁**
- ~~确认弹窗的粒度？~~ → **C: 预设白名单**，只有不在白名单的工具才弹窗确认
- ~~白名单如何管理？~~ → **A: 全局白名单**，所有 MCP 服务共享一个工具白名单
- ~~是否需要在确认弹窗中加入"添加到白名单"选项？~~ → **A: 需要**
- 是否需要查看 MCP 工具调用历史？→ 暂不做（YAGNI）

## 设计

### 架构布局

```
App.tsx
├── Sidebar
│   └── ⚙ 设置按钮（打开 SettingsModal）
├── main content (flex-1)
│   ├── ChatView
│   ├── InputArea
│   │   ├── 📎附件 🔌MCP选择 [textarea] [发送]
│   │   ├── McpSelector (下拉面板)
│   │   └── FileDropdown
│   ├── SettingsModal（⚙ 触发的 Modal）
│   │   ├── Tab: [MCP 服务器] [白名单] [主题]
│   │   ├── McpServerPanel（列表 + 新增/编辑/删除表单）
│   │   └── McpWhitelistPanel（白名单管理）
│   └── McpConfirmDialog（工具调用确认弹窗）
```

### 核心流程

#### 1. 配置 MCP 服务
```
用户点 ⚙ → SettingsModal → MCP 服务器 tab
  → 查看已配置的 MCP 服务器列表
  → [+ 新增] → 表单(name/command/args/env) → 保存到 .claude.json
  → [编辑] → 修改已有配置
  → [删除] → 从 .claude.json 移除
```

#### 2. 会话启用 MCP
```
用户点 🔌 → McpSelector 下拉面板
  → 展示所有 MCP 服务器（开关切换）
  → 切换开关 → 更新当前会话启用的 MCP 列表
```

#### 3. 工具调用确认
```
Claude CLI 调用 MCP 工具
  → 检查全局白名单
  → 在白名单：直接放行
  → 不在白名单：弹出 McpConfirmDialog
    → 显示：工具名 / MCP 服务名 / 参数
    → [拒绝] [允许] [允许并加入白名单]
```

## 新增文件

| 文件 | 职责 |
|------|------|
| `src/main/mcp-manager.ts` | 读写 `.claude.json` 的 mcpServers + 白名单 |
| `src/renderer/src/components/SettingsModal.tsx` | **新建**：设置面板 Modal |
| `src/renderer/src/components/McpServerPanel.tsx` | **新建**：MCP 服务器列表 + 表单 |
| `src/renderer/src/components/McpWhitelistPanel.tsx` | **新建**：白名单管理 |
| `src/renderer/src/components/McpSelector.tsx` | **新建**：输入区旁的 MCP 开关面板 |
| `src/renderer/src/components/McpConfirmDialog.tsx` | **新建**：工具调用确认弹窗 |

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/main/mcp-manager.ts` | 新建：MCP 配置 + 白名单读写 |
| `src/main/ipc-handlers.ts` | 注册 mcp:* + whitelist:* handler |
| `src/preload/index.ts` | 暴露 MCP + 白名单 API |
| `src/shared/types.ts` | 新增 McpServer + IPC 通道 |
| `src/renderer/src/components/SettingsModal.tsx` | 新建 |
| `src/renderer/src/components/McpServerPanel.tsx` | 新建 |
| `src/renderer/src/components/McpWhitelistPanel.tsx` | 新建 |
| `src/renderer/src/components/McpSelector.tsx` | 新建 |
| `src/renderer/src/components/McpConfirmDialog.tsx` | 新建 |
| `src/renderer/src/components/InputArea.tsx` | 🔌 按钮 + McpSelector |
| `src/renderer/src/components/Sidebar.tsx` | ⚙ 设置入口 |
| `src/renderer/src/context/AppContext.tsx` | MCP 选择状态 + 白名单状态 |

## 任务拆分

| # | 任务 | 预估 |
|---|------|------|
| 1 | MCP Manager（读写 .claude.json + 白名单） | 中 |
| 2 | IPC 通道 + 类型 + preload | 小 |
| 3 | SettingsModal 框架 + Tab 切换 | 中 |
| 4 | McpServerPanel（列表 + 新增/编辑表单） | 大 |
| 5 | McpWhitelistPanel（白名单管理） | 小 |
| 6 | McpSelector（输入区旁 MCP 开关面板） | 中 |
| 7 | McpConfirmDialog（工具调用确认弹窗） | 中 |
| 8 | Sidebar 设置入口 + InputArea 🔌 按钮 | 小 |
| 9 | 状态管理（会话 MCP 选择 + 白名单） | 小 |
| 10 | 测试 + 文档 | 小 |
