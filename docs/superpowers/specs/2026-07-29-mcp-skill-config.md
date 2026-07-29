# MCP + Skill 配置功能 — 需求文档

**日期：** 2026-07-29  
**状态：** 待实现

## 功能概述

用户可通过 GUI 查看和编辑 Claude Code CLI 的 MCP 服务器配置和 Skill 配置，配置变更实时生效。

## 背景知识

### Claude Code CLI 配置文件位置

- MCP 配置：`~/.claude/.claude.json`（或项目级 `.claude/settings.json`）
- Skill 配置：`~/.claude/skills/` 目录下每个 skill 一个 `SKILL.md` 文件

### MCP 配置结构（`.claude.json`）

```json
{
  "mcpServers": {
    "serverName": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@org/mcp-server"],
      "env": {}
    }
  }
}
```

### Skill 文件结构（`~/.claude/skills/<name>/SKILL.md`）

```markdown
---
name: skill-name
description: What this skill does
---
# Skill instructions...
```

## 实现方案

### MCP 配置管理

- 新增 `src/main/mcp-manager.ts`：读写 `.claude.json`
- IPC：`mcp:list` / `mcp:add` / `mcp:remove` / `mcp:update`
- GUI：设置面板中以 JSON 卡片形式展示每个 MCP server，支持新增/编辑/删除

### Skill 配置管理

- 新增 `src/main/skill-manager.ts`：扫描 `~/.claude/skills/` 目录
- IPC：`skill:list` / `skill:get` / `skill:update`
- GUI：设置面板中以文本区展示 SKILL.md 内容，可编辑保存

## 交互设计

### 入口

在侧边栏底部加一个 ⚙ 齿轮图标（与主题切换同排）。点击弹出设置面板（Modal）。

### 设置面板

```
┌─────────────────────────────────────────────┐
│  设置                               [✕]     │
│                                             │
│  [MCP 服务器]  [Skills]  [主题]  [关于]      │  ← tab 栏
│                                             │
│  ┌─ MCP 服务器 ──────────────────────────┐  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ serverName: npx -y @org/server   │  │  │
│  │  │ 状态: ✅ 运行中                  │  │  │
│  │  │ [编辑] [删除]                   │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │  [+ 新增 MCP 服务器]                  │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 新增/编辑 MCP 表单

```
服务器名称: [_______________]
命令类型:   [stdio ▼]
命令:       [_______________]
参数:       [_______________]   (逗号分隔)
环境变量:   [KEY=VALUE, ...]
[保存] [取消]
```

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/main/mcp-manager.ts` | 新建：MCP 配置读写 |
| `src/main/skill-manager.ts` | 新建：Skill 文件扫描读写 |
| `src/main/ipc-handlers.ts` | 注册 mcp:* + skill:* handler |
| `src/preload/index.ts` | 暴露 MCP/Skill API |
| `src/shared/types.ts` | 新增 McpServer / SkillInfo 类型 |
| `src/renderer/src/components/SettingsModal.tsx` | 新建：设置面板 |
| `src/renderer/src/components/McpPanel.tsx` | 新建：MCP 管理 |
| `src/renderer/src/components/SkillPanel.tsx` | 新建：Skill 管理 |
| `src/renderer/src/components/Sidebar.tsx` | 加设置入口按钮 |
| `src/renderer/src/context/AppContext.tsx` | 管理面板开关状态 |

## 任务拆分

| # | 任务 | 预估 |
|---|------|------|
| 1 | MCP Manager（读写 .claude.json） | 中 |
| 2 | Skill Manager（扫描 ~/.claude/skills/） | 中 |
| 3 | IPC 通道 + 类型 + preload | 小 |
| 4 | SettingsModal 框架 + tab 切换 | 中 |
| 5 | McpPanel 组件（列表 + 新增/编辑表单） | 大 |
| 6 | SkillPanel 组件（列表 + 编辑 Markdown） | 中 |
| 7 | Sidebar 设置入口 | 小 |
| 8 | 测试 + 文档 | 小 |
