# 主题切换功能 — 验收标准

**日期：** 2026-07-29  
**关联测试：** `docs/tests/14-theme-switching-test.md`

## 验收标准

### AC-1: CSS 变量系统

- [ ] `index.css` 定义了 17 个 CSS 自定义属性（`--bg-root`, `--bg-side`, `--bg-card`, `--bg-input`, `--bg-hover`, `--bg-active`, `--bg-code`, `--bg-overlay`, `--accent`, `--accent-hover`, `--accent-soft`, `--fg-primary`, `--fg-muted`, `--fg-dim`, `--border`, `--border-muted`, `--error-bg`, `--error-border`, `--error-text`, `--scrollbar-thumb`, `--scrollbar-thumb-hover`）
- [ ] `:root` / `.theme-warm` / `.theme-cool` / `.theme-light` 四套选择器均已定义
- [ ] 三套主题颜色语义一致（同名变量在不同主题下值不同但含义相同）

### AC-2: 组件颜色迁移

- [ ] 所有组件的 `className` 中不再出现硬编码十六进制颜色（`bg-[#xxxxxx]`、`text-[#xxxxxx]`）
- [ ] 所有泰尔威德颜色类（`text-gray-400`）已替换为 CSS 变量
- [ ] 迁移后编译零错误，build 成功

### AC-3: 主题 class 切换

- [ ] 应用启动时自动从 `settings.json` 读取 `theme` 字段
- [ ] `<html>` 元素上的 class 设置为 `theme-warm` / `theme-cool` / `theme-light` 之一
- [ ] 切换主题时 `<html>` class 即时更新（`useEffect`）

### AC-4: 主题切换 UI

- [ ] 侧边栏底部有三个圆形色块按钮
- [ ] 当前选中主题的色块有 accent 颜色边框 + 放大效果
- [ ] 点击色块即时切换主题（无延迟、无闪烁）

### AC-5: 持久化

- [ ] 切换主题时调用 `config:update-settings` 写入 `settings.json`
- [ ] 关闭应用重开后主题保持上次选择
- [ ] `settings.json` 中 `theme` 字段值与当前主题一致

### AC-6: 颜色兼容性

- [ ] 暖色主题：所有文字可读，按钮可见，边框清晰
- [ ] 冷色主题：同上，无硬编码暖色残留
- [ ] 明亮主题：同上，无硬编码暗色残留
- [ ] 错误提示在所有主题下对比度足够

### AC-7: 非回归

- [ ] 主题切换不影响消息收发功能
- [ ] 主题切换不影响会话切换功能
- [ ] 主题切换不影响模型切换功能

---

## 验收决策

| 标准 | 描述 | 阻塞 |
|------|------|------|
| AC-1 | CSS 变量系统 | 是 |
| AC-2 | 组件颜色迁移 | 是 |
| AC-3 | 主题 class 切换 | 是 |
| AC-4 | 切换 UI | 是 |
| AC-5 | 持久化 | 是 |
| AC-6 | 颜色兼容性 | 是 |
| AC-7 | 非回归 | 是 |

**所有 AC 必须通过才算验收合格。AC-1 ~ AC-5 未通过则不可合并。AC-6 ~ AC-7 如有个别组件颜色问题可单独修复后重新验收。**
