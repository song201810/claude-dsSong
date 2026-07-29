# 主题切换功能 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 用 CSS 变量替换所有硬编码颜色，支持暖色暗色 / 冷色暗色 / 明亮三套主题，提供侧边栏切换入口并持久化主题选择

**架构：** CSS 自定义属性 + `<html>` class 切换（`theme-warm`/`theme-cool`/`theme-light`）。Tailwind 4 组件从 `bg-[#xxxxx]` 迁移到 `bg-[var(--bg-card)]` 等语义变量。主题持久化通过 `config:update-settings` + `config:get-settings` 实现。

**技术栈：** CSS custom properties, React Context, Tailwind CSS 4

---

## 受影响文件

| 文件 | 角色 |
|------|------|
| `src/renderer/src/styles/index.css` | CSS 变量定义 + 三套主题 + 全局样式 |
| `src/renderer/src/App.tsx` | 读取 theme setting → 设置 `<html>` class |
| `src/renderer/src/components/Sidebar.tsx` | 底部加主题切换按钮 + 面板 |
| `src/renderer/src/components/ChatView.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/MessageBubble.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/InputArea.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/SessionItem.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/SessionList.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/NewSessionModal.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/CodeBlock.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/components/ModelSelect.tsx` | 颜色 → CSS 变量 |
| `src/renderer/src/context/AppContext.tsx` | theme 状态 + loadTheme |
| `src/shared/types.ts` | Settings.theme 类型收窄 |

---

### 任务 1：CSS 变量定义 + 三套主题

**文件：**
- 修改：`src/renderer/src/styles/index.css`

- [ ] **步骤 1：重写 index.css — 定义 CSS 变量 + 主题**

将当前文件替换为：

```css
@import "tailwindcss";

/* ============ CSS custom properties (warm dark — default) ============ */
:root, .theme-warm {
  --bg-root:    #1c1917;
  --bg-side:    #231f1d;
  --bg-card:    #292524;
  --bg-input:   #332e2b;
  --bg-hover:   #383230;
  --bg-active:  #44403c;
  --bg-code:    #1e1b19;
  --bg-overlay: rgba(0,0,0,0.6);

  --accent:       #f0836a;
  --accent-hover: #e0684e;
  --accent-soft:  rgba(240,131,106,0.20);

  --fg-primary: #faf7f2;
  --fg-muted:   #a8a29e;
  --fg-dim:     #6b6560;

  --border:  #3a3430;
  --border-muted: rgba(58,52,48,0.5);

  --error-bg:   rgba(153,27,27,0.4);
  --error-border: rgba(153,27,27,0.5);
  --error-text:  #fecaca;

  --scrollbar-thumb: #44403c;
  --scrollbar-thumb-hover: #57534e;
}

/* ============ cool dark theme ============ */
.theme-cool {
  --bg-root:    #0f1117;
  --bg-side:    #161822;
  --bg-card:    #1d2030;
  --bg-input:   #252840;
  --bg-hover:   #2a2e40;
  --bg-active:  #353b55;
  --bg-code:    #13151f;
  --bg-overlay: rgba(0,0,0,0.65);

  --accent:       #7c8cf8;
  --accent-hover: #6b7ce0;
  --accent-soft:  rgba(124,140,248,0.20);

  --fg-primary: #f0f0ff;
  --fg-muted:   #9ca0b8;
  --fg-dim:     #636680;

  --border:  #2c3045;
  --border-muted: rgba(44,48,69,0.5);

  --error-bg:   rgba(127,29,29,0.4);
  --error-border: rgba(127,29,29,0.5);
  --error-text:  #fecaca;

  --scrollbar-thumb: #353b55;
  --scrollbar-thumb-hover: #4a5170;
}

/* ============ light theme ============ */
.theme-light {
  --bg-root:    #f8f6f2;
  --bg-side:    #f0ede7;
  --bg-card:    #ffffff;
  --bg-input:   #f0ede7;
  --bg-hover:   #e8e4dc;
  --bg-active:  #ddd8cf;
  --bg-code:    #f0ede7;
  --bg-overlay: rgba(0,0,0,0.3);

  --accent:       #e0684e;
  --accent-hover: #c9553e;
  --accent-soft:  rgba(224,104,78,0.15);

  --fg-primary: #1c1917;
  --fg-muted:   #6b6560;
  --fg-dim:     #a8a29e;

  --border:  #d6d0c8;
  --border-muted: rgba(214,208,200,0.5);

  --error-bg:   rgba(254,202,202,0.6);
  --error-border: rgba(248,113,113,0.5);
  --error-text:  #991b1b;

  --scrollbar-thumb: #d6d0c8;
  --scrollbar-thumb-hover: #c4bdb2;
}

/* ============ global scrollbar ============ */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

html, body, #root {
  height: 100%; margin: 0; padding: 0; overflow: hidden;
}
```

- [ ] **步骤 2：编译验证**

```bash
cd D:/project/claude/desktop && npx electron-vite build
```

预期：build 成功（CSS 变更，renderer 重新构建）

- [ ] **步骤 3：Commit**

```bash
git add src/renderer/src/styles/index.css
git commit -m "feat: define CSS custom properties for warm/cool/light themes"
```

---

### 任务 2：全局颜色替换 — 全部组件

**文件：**
- 修改：`src/renderer/src/App.tsx`
- 修改：`src/renderer/src/components/Sidebar.tsx`
- 修改：`src/renderer/src/components/SessionItem.tsx`
- 修改：`src/renderer/src/components/SessionList.tsx`
- 修改：`src/renderer/src/components/NewSessionModal.tsx`
- 修改：`src/renderer/src/components/ChatView.tsx`
- 修改：`src/renderer/src/components/MessageBubble.tsx`
- 修改：`src/renderer/src/components/CodeBlock.tsx`
- 修改：`src/renderer/src/components/InputArea.tsx`
- 修改：`src/renderer/src/components/ModelSelect.tsx`

**颜色映射表（Tailwind 任意值 → CSS 变量）：**

| 旧值 | 新值 |
|------|------|
| `bg-[#1c1917]` | `bg-[var(--bg-root)]` |
| `bg-[#231f1d]` | `bg-[var(--bg-side)]` |
| `bg-[#292524]` | `bg-[var(--bg-card)]` |
| `bg-[#332e2b]` | `bg-[var(--bg-input)]` |
| `bg-[#383230]` | `bg-[var(--bg-hover)]` |
| `bg-[#44403c]` | `bg-[var(--bg-active)]` |
| `bg-[#1e1b19]` | `bg-[var(--bg-code)]` |
| `#1c1917` 相关深色 | `bg-[var(--bg-root)]` |
| `text-[#faf7f2]` | `text-[var(--fg-primary)]` |
| `text-[#d6cbc4]` | `text-[var(--fg-primary)]` |
| `text-[#a8a29e]` | `text-[var(--fg-muted)]` |
| `text-[#6b6560]` | `text-[var(--fg-dim)]` |
| `text-white` | `text-[var(--fg-primary)]` |
| `text-gray-*` | `text-[var(--fg-muted)]` 或 `text-[var(--fg-dim)]` |
| `bg-[#f0836a]` | `bg-[var(--accent)]` |
| `bg-[#e0684e]` | `bg-[var(--accent-hover)]` |
| `bg-[#f0836a]/20` | `bg-[var(--accent-soft)]` |
| `text-[#f0836a]` | `text-[var(--accent)]` |
| `border-[#f0836a]` | `border-[var(--accent)]` |
| `border-[#3a3430]` | `border-[var(--border)]` |
| `border-[#3a3430]/50` | `border-[var(--border-muted)]` |
| `border-[#f0836a]/30` | `border-[var(--accent)]` 或保持 |
| `shadow-[#f0836a]/20` | `shadow-[var(--accent)]/20` |
| `border-gray-*` | `border-[var(--border)]` |
| `#1c1917/40` (bg overlay) | `bg-[var(--bg-root)]/40` |
| `#1c1917/50` | `bg-[var(--bg-root)]/50` |
| 错误色 `red-*` | `bg-[var(--error-bg)]` / `border-[var(--error-border)]` / `text-[var(--error-text)]` |

- [ ] **步骤 1：逐组件替换 App.tsx**

```tsx
// 旧
<div className="flex h-screen bg-[#1c1917] text-[#faf7f2] overflow-hidden">
// 新
<div className="flex h-screen bg-[var(--bg-root)] text-[var(--fg-primary)] overflow-hidden">
```

- [ ] **步骤 2：替换 Sidebar.tsx**

```tsx
// 旧
<div className="flex flex-col h-full bg-[#231f1d] w-[280px] min-w-[200px] border-r border-[#3a3430]">
// 新
<div className="flex flex-col h-full bg-[var(--bg-side)] w-[280px] min-w-[200px] border-r border-[var(--border)]">

// 旧: hover:bg-[#383230] text-[#a8a29e] hover:text-[#faf7f2]
// 新: hover:bg-[var(--bg-hover)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
```

- [ ] **步骤 3：替换 SessionItem.tsx**

```tsx
// border-b border-[#3a3430]/50  →  border-b border-[var(--border-muted)]
// bg-[#44403c] → bg-[var(--bg-active)]
// hover:bg-[#383230] → hover:bg-[var(--bg-hover)]
// text-[#faf7f2] → text-[var(--fg-primary)]
// text-[#d6cbc4] → text-[var(--fg-muted)]  (or fg-primary — choose one)
// text-[#6b6560] → text-[var(--fg-dim)]
// hover:text-[#f0836a] → hover:text-[var(--accent)]
```

- [ ] **步骤 4：替换 SessionList.tsx**

```tsx
// 旧: text-gray-400 → text-[var(--fg-muted)]
// 旧: text-gray-600 → text-[var(--fg-dim)]
```

- [ ] **步骤 5：替换 NewSessionModal.tsx**

```tsx
// bg-black/60 → bg-[var(--bg-overlay)]
// border-gray-600 → border-[var(--border)]
// 所有其他颜色按映射表替换
```

- [ ] **步骤 6：替换 ChatView.tsx**

```tsx
// bg-[#1a1b1e]/60 → bg-[var(--bg-side)]/60
// bg-[#313338] → bg-[var(--bg-input)]
// border-gray-700/50 → border-[var(--border-muted)]
// 错误 banner: bg-red-950/40 → bg-[var(--error-bg)]
//             border-red-800/50 → border-[var(--error-border)]
//             text-red-200 → text-[var(--error-text)]
```

- [ ] **步骤 7：替换 MessageBubble.tsx**

```tsx
// 用户气泡 bg-[#e0684e] → bg-[var(--accent-hover)]
// AI 气泡 bg-[#292524] → bg-[var(--bg-card)]
// 其他颜色按映射表替换
```

- [ ] **步骤 8：替换 CodeBlock.tsx**

```tsx
// 代码背景 bg-[#1e1b19] → bg-[var(--bg-code)]
// 代码头部 bg-[#332e2b] → bg-[var(--bg-input)]
// border-gray-700 → border-[var(--border)]
```

- [ ] **步骤 9：替换 InputArea.tsx**

```tsx
// bg-[#1c1917] → bg-[var(--bg-root)]
// bg-[#332e2b] → bg-[var(--bg-input)]
// border-[#3a3430] → border-[var(--border)]
// 所有颜色按映射表替换
```

- [ ] **步骤 10：替换 ModelSelect.tsx**

```tsx
// bg-[#313338] → bg-[var(--bg-input)]
// 所有颜色按映射表替换
```

- [ ] **步骤 11：编译验证**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.web.json && npx electron-vite build
```

预期：编译零错误，构建成功。

- [ ] **步骤 12：Commit**

```bash
git add -A && git commit -m "feat: migrate all components from hardcoded colors to CSS custom properties"
```

---

### 任务 3：App.tsx 主题 class 切换 + Settings type 收窄

**文件：**
- 修改：`src/shared/types.ts`
- 修改：`src/renderer/src/context/AppContext.tsx`
- 修改：`src/renderer/src/App.tsx`

- [ ] **步骤 1：收窄 Settings.theme 类型（types.ts）**

找到 `Settings` 接口，将 `theme` 类型改为：

```typescript
export interface Settings {
  defaultModel: string
  models: ModelInfo[]
  theme: 'warm' | 'cool' | 'light'
}
```

（去掉 `?` 使其必选，默认值为 `'warm'`）

- [ ] **步骤 2：更新 config-manager.ts 默认设置**

```typescript
const DEFAULT_SETTINGS: Settings = {
  defaultModel: 'claude-sonnet-4-6',
  models: DEFAULT_MODELS,
  theme: 'warm',
}
```

- [ ] **步骤 3：AppContext 新增 loadTheme + setTheme（AppContext.tsx）**

```typescript
// State 新增
interface AppState {
  // ...existing...
  theme: 'warm' | 'cool' | 'light'
}

const initialState: AppState = {
  // ...existing...
  theme: 'warm',
}

// Action 新增
| { type: 'SET_THEME'; payload: 'warm' | 'cool' | 'light' }

// reducer 新增
case 'SET_THEME':
  return { ...state, theme: action.payload }

// Context 新增方法
interface AppContextType {
  // ...existing...
  setTheme: (theme: 'warm' | 'cool' | 'light') => Promise<void>
}

// 实现
const loadTheme = useCallback(async () => {
  const settings = await window.api.getSettings()
  dispatch({ type: 'SET_THEME', payload: settings.theme || 'warm' })
}, [])

const setTheme = useCallback(async (theme: 'warm' | 'cool' | 'light') => {
  await window.api.updateSettings({ theme })
  dispatch({ type: 'SET_THEME', payload: theme })
}, [])

// 初始化中调用
useEffect(() => { loadSessions(); loadModels(); loadTheme() }, [loadSessions, loadModels, loadTheme])
```

- [ ] **步骤 4：App.tsx 应用 theme class 到 `<html>`**

```tsx
import { useAppContext } from './context/AppContext'

export default function App() {
  const { state } = useAppContext()
  const themeClass = `theme-${state.theme}`

  useEffect(() => {
    document.documentElement.className = themeClass
  }, [themeClass])

  return (
    <div className="flex h-screen bg-[var(--bg-root)] text-[var(--fg-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView />
        <InputArea />
      </div>
    </div>
  )
}
```

（需要导入 `useEffect`）

- [ ] **步骤 5：编译验证**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.node.json && npx tsc --noEmit -p tsconfig.web.json && npx electron-vite build
```

- [ ] **步骤 6：Commit**

```bash
git add -A && git commit -m "feat: wire theme via Settings, apply theme class to document root on startup"
```

---

### 任务 4：侧边栏主题切换按钮 + 选择面板

**文件：**
- 修改：`src/renderer/src/components/Sidebar.tsx`

- [ ] **步骤 1：在 Sidebar 底部加入主题切换面板**

```tsx
// Sidebar.tsx — 在 <SessionList /> 下方加入：

<div className="mt-auto border-t border-[var(--border)] px-4 py-3">
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs text-[var(--fg-dim)]">主题</span>
  </div>
  <div className="flex gap-2">
    <button
      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer
        bg-[#231f1d] ${state.theme === 'warm' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}
      onClick={() => setTheme('warm')}
      title="暖色"
    />
    <button
      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer
        bg-[#161822] ${state.theme === 'cool' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}
      onClick={() => setTheme('cool')}
      title="冷色"
    />
    <button
      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer
        bg-[#ffffff] ${state.theme === 'light' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}
      onClick={() => setTheme('light')}
      title="明亮"
    />
  </div>
</div>
```

需要从 `useAppContext()` 获取 `state.theme` 和 `setTheme`。

- [ ] **步骤 2：编译验证**

```bash
cd D:/project/claude/desktop && npx tsc --noEmit -p tsconfig.web.json && npx electron-vite build
```

- [ ] **步骤 3：Commit**

```bash
git add src/renderer/src/components/Sidebar.tsx && git commit -m "feat: add theme switcher with three color swatches at sidebar bottom"
```

---

### 任务 5：功能测试 + 文档

- [ ] **步骤 1：启动应用测试三个主题**

```bash
cd D:/project/claude/desktop && npm run dev
```

测试清单：
- [ ] 默认暖色主题正常显示（与之前一致）
- [ ] 点击冷色按钮：全界面切换到紫色调暗色
- [ ] 点击明亮按钮：全界面切换到浅色主题
- [ ] 关闭重开：主题保持上次选择
- [ ] 所有组件在三套主题下都无颜色异常（白底白字等）

- [ ] **步骤 2：创建测试文档**

创建 `docs/tests/14-theme-switching-test.md`，记录以上 5 个检查项的结果。

- [ ] **步骤 3：修复发现的问题**（如有）

- [ ] **步骤 4：最终 Commit**

```bash
git add -A && git commit -m "test: add theme switching test document"
```
