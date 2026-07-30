# MCP 配置功能 — 实现计划

> **日期：** 2026-07-30  
> **目标：** GUI 管理 MCP 服务器 + 会话级启用/禁用 + 工具调用确认弹窗 + 白名单

## 受影响文件

| 文件 | 角色 |
|------|------|
| `src/main/mcp-manager.ts` | **新建**: 读写 .claude.json + 白名单 |
| `src/main/ipc-handlers.ts` | 注册 mcp:* + whitelist:* handler |
| `src/preload/index.ts` | 暴露 MCP API |
| `src/shared/types.ts` | McpServer 类型 + IPC 通道 |
| `src/renderer/src/components/SettingsModal.tsx` | **新建**: 设置面板 Modal |
| `src/renderer/src/components/McpServerPanel.tsx` | **新建**: MCP 服务器列表 + 表单 |
| `src/renderer/src/components/McpWhitelistPanel.tsx` | **新建**: 白名单管理 |
| `src/renderer/src/components/McpSelector.tsx` | **新建**: 输入区旁 MCP 开关面板 |
| `src/renderer/src/components/McpConfirmDialog.tsx` | **新建**: 工具调用确认弹窗 |
| `src/renderer/src/components/InputArea.tsx` | 🔌 按钮 + McpSelector |
| `src/renderer/src/components/Sidebar.tsx` | ⚙ 设置入口 |
| `src/renderer/src/context/AppContext.tsx` | MCP 选择 + 白名单状态 |

## 任务拆分

- [x] 1. MCP Manager（读写 .claude.json + 白名单）
- [x] 2. IPC 通道 + 类型 + preload
- [x] 3. SettingsModal 框架 + Tab 切换
- [x] 4. McpServerPanel（列表 + 新增/编辑表单）
- [x] 5. McpWhitelistPanel（白名单管理）
- [x] 6. McpSelector（输入区旁 MCP 开关面板）
- [x] 7. McpConfirmDialog（工具调用确认弹窗）
- [x] 8. Sidebar 设置入口 + InputArea 🔌 按钮
- [x] 9. 状态管理（会话 MCP 选择 + 白名单）
- [x] 10. 测试 + 文档
