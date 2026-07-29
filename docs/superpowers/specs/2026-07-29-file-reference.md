# @file 文件引用功能 — 需求文档

**日期：** 2026-07-29  
**状态：** 待实现

## 功能概述

用户在输入框中输入 `@` 时触发文件路径自动补全，从当前工作目录读取文件列表，支持键盘上下选择 + Enter 确认 + 鼠标点击选择。

## 实现方案

### 触发机制

在 `textarea` 中监听 `@` 字符输入：
- 用户输入 `@` → 弹出文件选择下拉
- 继续输入字母 → 过滤匹配的文件/目录
- 按 `↓` `↑` 移动高亮 → `Enter` 确认
- 确认后插入相对路径 `@path/to/file.ts` 到光标位置
- 无 `@` 前缀时下拉自动关闭

### 文件树获取

新增 IPC 通道 `app:list-files`：
```
渲染进程 → IPC → 主进程 → fs.readdirSync(workDir, recursive, maxDepth=3)
                  → 返回 { name, path, isDir }[]
```

### UI 设计

```
┌─────────────────────────────────────────────┐
│  帮我改一下 @src/main/ind│                   │
│  ┌─────────────────────────────────────┐    │
│  │ 📄 src/main/index.ts               │ ←  │
│  │ 📄 src/main/ipc-handlers.ts         │    │
│  │ 📁 src/main/                        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

- 下拉列表：绝对定位在光标下方
- 最多显示 10 条，超出可滚动
- 目录用 📁 图标，文件用 📄 图标
- 高亮项用珊瑚色背景
- 点击外部自动关闭

### 数据模型

```typescript
// 新增类型
export interface FileNode {
  name: string
  path: string
  isDir: boolean
}

// 新增 IPC 通道
APP_LIST_FILES: 'app:list-files'
```

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | 新增 FileNode、IPC 通道 |
| `src/main/ipc-handlers.ts` | app:list-files handler |
| `src/preload/index.ts` | 暴露 listFiles API |
| `src/renderer/src/components/InputArea.tsx` | @ 触发 + 下拉组件 |
| `src/renderer/src/components/FileDropdown.tsx` | 新建：文件选择下拉 |

## 任务拆分

| # | 任务 | 预估 |
|---|------|------|
| 1 | 类型 + IPC 通道 + 主进程 file lister | 小 |
| 2 | FileDropdown 组件（渲染、过滤、键盘导航、鼠标点击） | 大 |
| 3 | InputArea 集成 @ 触发逻辑 | 中 |
| 4 | 点击外部关闭 + 样式调优 | 小 |
| 5 | 测试 + 文档 | 小 |
