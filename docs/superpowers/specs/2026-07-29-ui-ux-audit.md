# 界面优化审计 — Claude Code Desktop

**日期：** 2026-07-29  
**技能：** UI/UX Pro Max Design Intelligence  
**堆栈：** Electron + React 19 + Tailwind CSS 4

## 发现问题清单（按严重程度排序）

### 严重 (P0) — 可访问性与键盘导航

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| A1 | **缺少 focus 状态** — 几乎所有输入/按钮都用了 `outline-none` 但未提供替代的焦点指示器 | 全局 | 确保所有 `outline-none` 的元素有 `focus:ring-2 focus:ring-[var(--accent)]` 替代 |
| A2 | **Emoji 作为图标** — 多处使用 emoji（🤖💬⚠️📄📎）而非 SVG 图标 | `ChatView.tsx`、`SessionList.tsx` | 替换为 Phosphor 或 Lucide SVG 图标，面部表情、通信和代码类推荐使用 Phosphor |
| A3 | **无 skip link** — 键盘用户在消息列表和会话列表之间切换需要多次 Tab | `App.tsx` | 考虑在应用顶部添加 "跳转到对话" / "跳转到侧栏" 的 skip 链接 |
| A4 | **Tab 顺序不一致** — 会话列表中的 Tab 顺序可能与视觉顺序不匹配 | `SessionItem.tsx` | 确保 `tabIndex` 遵循逻辑顺序 |

### 重要 (P1) — 交互与反馈

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| B1 | **删除按钮 hover 完全依赖 visibility** — 在移动端/触屏上无法显示删除按钮 | `SessionItem.tsx` | 添加基于点击的长按事件或滑动删除手势 |
| B2 | **消息气泡间距过大** — `mb-4 px-4` 导致最大宽度被挤压 | `MessageBubble.tsx` | 收紧为 `mb-3 px-3`，在消息密集的场景下更紧凑专业 |
| B3 | **流式光标闪烁不连贯** — `animate-pulse` 是整块的渐隐渐现，不是字符级别的光标闪烁 | `MessageBubble.tsx` | 改为 `animate-[pulse_0.6s_ease-in-out_infinite]` 或改用 CSS step-end 实现离散闪烁 |
| B4 | **点击区域过小** — 删除按钮 `w-7 h-7` (28px < 44px 最低要求)、添加按钮 `px-1` 极窄、主题切换色块 `w-7 h-7` 不足 44px | `Sidebar.tsx`、`SessionItem.tsx` | 扩大为 `w-11 h-11` 或 `min-w-[44px] min-h-[44px]` |
| B5 | **发送按钮在禁用和可用状态下视觉差异不明显** | `InputArea.tsx` | 加大从 40% 到 60% 不透明度，或用更明显的颜色变化 |
| B6 | **弹窗背景缺少 escape 键关闭支持** | `NewSessionModal.tsx` | 已有 `onKeyDown`，但缺少点击外部区域关闭的功能 |

### 中等 (P2) — 视觉与一致性问题

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| C1 | **信息密度过低** — 会话名和副信息间距大、字体过细 | `SessionItem.tsx` | 消息预览行字体加稍粗（`font-medium`），帮助区分活跃与非活跃会话 |
| C2 | **代码块内 text-[var(--fg-primary)] → 暖色主题下深灰偏白** — 代码区域在暖色下与普通消息文本颜色相同 | `CodeBlock.tsx` | 代码块保持 `text-[var(--fg-muted)]` 给标签和代码内容较低优先级 |
| C3 | **新建会话弹窗输入框 placeholder 颜色与输入文字颜色相同** — 用户分不清是内容还是 placeholder | `NewSessionModal.tsx` | `placeholder-[var(--fg-dim)]` 保持 dim，输入文字用 `text-[var(--fg-primary)]` |
| C4 | **缺少滚动位置记忆** — 切到别的会话再切回来，消息列表从头滚动 | `ChatView.tsx` | 增加每个会话的独立滚动位置记忆（`useRef<Map<string, number>>`） |
| C5 | **主题色块无描述文字** — 按钮没有视觉标签，用户不知道是什么 | `Sidebar.tsx` | 色块下方加简短中文标签（"暖色" / "冷色" / "明亮"） |

### 低 (P3) — 精细化打磨

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| D1 | **无打字声音/触感反馈** | 全局 | 可选：流式滚动时新增轻微声音或触感（Windows Notifications API） |
| D2 | **消息时间戳不显示** | `MessageBubble.tsx` | 每条消息右下角显示发送时间（hh:mm），hover 时显示完整时间 |
| D3 | **空状态快捷键卡片中 Esc 仍存在但功能已移除** | `ChatView.tsx` | 移除 Esc 卡片，只保留 Enter 和 Shift+Enter 两个卡片 |
| D4 | **无动画效果的会话切换** | `ChatView.tsx` | 切会话时加轻微的渐入效果（fade-in 150ms） |

---

## 优先修复建议

### 快速修复（低成本高影响）
1. ✅ 移除空状态的 Esc 卡片（D3）
2. ✅ 主题色块加标签（C5）
3. ✅ 所有可点击元素加 `cursor-pointer`（已在大部分元素上有）
4. ✅ 按钮 touch targets 加至 44px（B4）

### 中修复（1-2 文件改动）
5. 消息气泡间距收紧（B2）
6. 代码块颜色微调（C2）
7. 消息时间戳（D2）

### 大修复（多文件架构变更）
8. 全部 Emoji → Phosphor SVG 图标（A2）
9. 每个会话独立恢复滚动位置（C4）
10. 全应用焦点状态统一审核（A1）
