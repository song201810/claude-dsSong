# UI/UX 界面优化任务 — 实现文档

**日期：** 2026-07-29  
**来源：** `docs/superpowers/specs/2026-07-29-ui-ux-audit.md`

## 分批策略

| 批次 | 优先级 | 任务数 | 说明 |
|------|--------|--------|------|
| 第 1 批 | P0-P1 快速修复 | 5 | 低改动量、高影响 |
| 第 2 批 | P2 视觉一致性 | 4 | 1-2 文件改动 |
| 第 3 批 | P3 精细化 | 3 | 锦上添花 |

---

## 第 1 批：快速修复

### 任务 1：移除空状态 Esc 卡片 (D3)

**文件：** `src/renderer/src/components/ChatView.tsx`

**改动：** 空状态 3 列网格改为 2 列，只保留 Enter 和 Shift+Enter。

```tsx
// 旧：grid grid-cols-3 gap-4
// 新：grid grid-cols-2 gap-4 max-w-sm w-full
// 删除 Esc 卡片
```

### 任务 2：主题色块加标签 (C5)

**文件：** `src/renderer/src/components/Sidebar.tsx`

**改动：** 每个色块按钮下方添加中文描述文字。

```tsx
<div className="flex flex-col items-center gap-1">
  <button ... />
  <span className="text-[10px] text-[var(--fg-dim)]">暖色</span>
</div>
```

### 任务 3：扩大按钮点击区域至 44px (B4)

**文件：**
- `src/renderer/src/components/Sidebar.tsx` — 主题色块 + 新建按钮
- `src/renderer/src/components/SessionItem.tsx` — 删除按钮

**改动：** `w-7 h-7` → `w-11 h-11` (44px)，色块按钮用 `p-1.5` 扩展点击区域。

### 任务 4：消息气泡间距收紧 (B2)

**文件：** `src/renderer/src/components/MessageBubble.tsx`

**改动：** `mb-4 px-4` → `mb-2 px-3`

### 任务 5：发送按钮禁用态对比度提升 (B5)

**文件：** `src/renderer/src/components/InputArea.tsx`

**改动：** `disabled:opacity-40` → `disabled:opacity-60`

---

## 第 2 批：视觉一致性

### 任务 6：代码块颜色微调 (C2)

**文件：** `src/renderer/src/components/CodeBlock.tsx`

**改动：** 代码内容 `text-[var(--fg-primary)]` → `text-[var(--fg-muted)]`，与普通消息文本区分。

### 任务 7：新建会话弹窗输入框 placeholder 与输入文字区分 (C3)

**文件：** `src/renderer/src/components/NewSessionModal.tsx`

**改动：** 工作目录输入框（readonly 的那个）保持 `text-[var(--fg-muted)]`，会话名称输入框用 `text-[var(--fg-primary)]`。

### 任务 8：会话切换动画 (D4)

**文件：** `src/renderer/src/components/ChatView.tsx`

**改动：** 消息列表容器加 `animate-[fadeIn_150ms_ease-out]`，切换会话时触发。需要在 `AppContext` 中加一个切换状态标志，或者在 CSS 中定义 fadeIn 关键帧。

### 任务 9：消息时间戳 (D2)

**文件：** `src/renderer/src/components/MessageBubble.tsx` + `src/shared/types.ts`

**改动：**
1. `Message` 接口已有 `timestamp: string`
2. 每条消息右下角显示格式化时间：
```tsx
<span className="text-[10px] text-[var(--fg-dim)] mt-1 block text-right">
  {formatTime(message.timestamp)}
</span>
```

---

## 第 3 批：架构变更

### 任务 10：全局焦点状态统一审核 (A1)

**文件：** 所有包含 `focus:outline-none` 的组件

**改动：** 统一替换为非弃用的焦点替代方案：
```tsx
// 旧
className="... focus:outline-none focus:border-[var(--accent)]"

// 新（加 ring）
className="... focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
```

### 任务 11：Emoji 图标替换 (A2)

**文件：**
- `ChatView.tsx` — 🤖 ⚠️ → SVG
- `SessionList.tsx` — 💬 → SVG
- 其他 emoji 使用处

**改动：** 安装 `lucide-react`，引入 Bot、MessageSquare、AlertTriangle 等图标。

### 任务 12：每个会话独立滚动位置 (C4)

**文件：** `src/renderer/src/components/ChatView.tsx` + `src/renderer/src/context/AppContext.tsx`

**改动：**
1. ChatView 中使用 `useRef<Map<string, number>>` 保存每个会话的 scrollTop
2. 会话切换时：保存当前 scrollTop → 恢复新会话 scrollTop
3. `scrollIntoView` 只在消息更新/流式时自动滚动

---

## 颜色快速参考

| 变量 | 用途 |
|------|------|
| `--fg-primary` | 主文字、标题、重要文本 |
| `--fg-muted` | 辅助文字、代码内容、标签 |
| `--fg-dim` | 时间戳、placeholder、非常用文本 |
| `--accent` | 强调、焦点环、按钮、链接 |
| `--accent-hover` | 用户气泡背景、hover 强调 |
