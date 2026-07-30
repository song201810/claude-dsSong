# 主题切换功能 — 需求文档

**日期：** 2026-07-29  
**状态：** ✅ 已实现

## 功能概述

在应用内支持用户在预设主题之间切换，主题设置持久化到 `settings.json`，重启后保持。当前已有暖色暗色主题（`warm`），新增经典冷色暗色主题（`cool`）和明亮主题（`light`），共三套。

## 配色方案

### 暖色暗色 `warm`（当前默认）
| 令牌 | 值 |
|------|----|
| bg-root | `#1c1917` |
| bg-side | `#231f1d` |
| bg-card | `#292524` |
| bg-input | `#332e2b` |
| accent | `#f0836a` |
| accent-hv | `#e0684e` |

### 冷色暗色 `cool`
| 令牌 | 值 |
|------|----|
| bg-root | `#0f1117` |
| bg-side | `#161822` |
| bg-card | `#1d2030` |
| bg-input | `#252840` |
| accent | `#7c8cf8` |
| accent-hv | `#6b7ce0` |

### 明亮 `light`
| 令牌 | 值 |
|------|----|
| bg-root | `#f8f6f2` |
| bg-side | `#f0ede7` |
| bg-card | `#ffffff` |
| bg-input | `#f0ede7` |
| accent | `#e0684e` |
| accent-hv | `#c9553e` |

## 实现方案：CSS 变量 + Tailwind

Tailwind CSS 4 不支持运行时 `tailwind.config` 切换（那是构建时的）。方案：**CSS 自定义属性 + 主题 class**。

```css
/* warm (default) */
:root, .theme-warm {
  --bg-root: #1c1917;
  --bg-side: #231f1d;
  --bg-card: #292524;
  --bg-input: #332e2b;
  --accent: #f0836a;
  --accent-hv: #e0684e;
  --fg-primary: #faf7f2;
  --fg-muted: #a8a29e;
  --fg-dim: #6b6560;
  --border: #3a3430;
}

.theme-cool {
  --bg-root: #0f1117;
  ...
}

.theme-light {
  --bg-root: #f8f6f2;
  ...
}
```

**所有硬编码颜色 `bg-[#xxxxx]` 替换为 `bg-[var(--bg-root)]`。**

## 交互设计

- **切换入口**：侧边栏底部齿轮图标 → 点击弹出主题选择面板
- **面板内容**：三个圆形色块（对应三套主题），点击即切
- **持久化**：切换时调用 `config:update-settings`，写入 `theme` 字段
- **启动恢复**：App 启动时从 `config:get-settings` 读取 `theme`，在 `<html>` 上加对应 class

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/renderer/src/styles/index.css` | 定义 CSS 变量 + 三套主题 |
| `src/renderer/src/App.tsx` | 读取 theme 设置，应用 class 到根元素 |
| `src/renderer/src/components/Sidebar.tsx` | 底部加主题切换按钮 + 面板 |
| `src/renderer/src/components/ChatView.tsx` | 硬编码颜色 → CSS 变量 |
| `src/renderer/src/components/MessageBubble.tsx` | 硬编码颜色 → CSS 变量 |
| `src/renderer/src/components/InputArea.tsx` | 硬编码颜色 → CSS 变量 |
| `src/renderer/src/components/SessionItem.tsx` | 硬编码颜色 → CSS 变量 |
| `src/renderer/src/components/NewSessionModal.tsx` | 硬编码颜色 → CSS 变量 |
| `src/renderer/src/components/CodeBlock.tsx` | 硬编码颜色 → CSS 变量 |
| `src/renderer/src/components/ModelSelect.tsx` | 硬编码颜色 → CSS 变量 |
| `src/shared/types.ts` | Settings.theme 类型收窄 |

## 任务拆分

| # | 任务 | 预估 |
|---|------|------|
| 1 | CSS 变量定义 + 三套主题 + 根元素 class 切换 | 中 |
| 2 | 全局颜色替换：所有组件硬编码 → CSS 变量 | 大 |
| 3 | 侧边栏主题切换按钮 + 选择面板 | 小 |
| 4 | 测试 + 文档 | 小 |
