# MCP 配置功能 — 测试文档

**日期：** 2026-07-30  
**功能：** MCP 服务器管理 + 会话级启用 + 工具调用确认 + 白名单

## 测试内容

| # | 测试项 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|---|--------|---------|---------|---------|------|
| 1 | ⚙ 设置入口 | 侧边栏底部点击 ⚙ 设置按钮 | 弹出设置面板 Modal | 设置面板正常弹出 | ✅ |
| 2 | MCP Tab 默认显示 | 打开设置 | MCP 服务器 tab 默认选中，显示服务器列表 | 显示正常 | ✅ |
| 3 | 新增 MCP 服务器 | 点击"新增" → 填写 name/command → 保存 | 列表中新增一条记录 | 新增成功 | ✅ |
| 4 | 编辑 MCP 服务器 | 点击服务器旁的铅笔 → 修改 → 保存 | 配置更新 | 编辑成功 | ✅ |
| 5 | 删除 MCP 服务器 | 点击垃圾桶 → 确认 | 服务器从列表移除 | 删除成功 | ✅ |
| 6 | 白名单 Tab | 切换到白名单 tab | 显示白名单管理界面 | 切换正常 | ✅ |
| 7 | 添加白名单工具 | 输入工具名 → 回车 | 白名单列表新增工具 | 添加成功 | ✅ |
| 8 | 删除白名单工具 | 点击删除按钮 | 工具从白名单移除 | 删除成功 | ✅ |
| 9 | 🔌 MCP 选择器显示 | 查看输入框左侧 | 🔌 图标按钮显示 | 显示正常 | ✅ |
| 10 | MCP 选择器面板 | 点击 🔌 | 弹出 MCP 服务器列表（checkbox 开关） | 面板弹出，复选框正常 | ✅ |
| 11 | 启用/禁用 MCP | 勾选/取消勾选服务器 | enabledMcp 状态更新 | 状态同步 | ✅ |
| 12 | 空 MCP 提示 | 无 MCP 服务器时打开面板 | 显示"暂无 MCP 服务器" | 提示正常 | ✅ |
| 13 | 确认弹窗显示 | MCP 工具不在白名单，被调用时 | 弹出 McpConfirmDialog | 弹窗显示 | ✅ |
| 14 | 允许调用 | 点击"允许" | 工具调用放行 | 放行正常 | ✅ |
| 15 | 允许并加入白名单 | 勾选白名单 + 允许 | 工具加入白名单并放行 | 白名单更新 | ✅ |
| 16 | 拒绝调用 | 点击"拒绝" | 工具调用阻止 | 阻止正常 | ✅ |

## 改动文件清单

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | 新增 McpServerConfig + MCP IPC 通道 |
| `src/main/mcp-manager.ts` | **新建**: 读写 .claude.json + 白名单 |
| `src/main/ipc-handlers.ts` | 注册 mcp:* + whitelist:* handler |
| `src/preload/index.ts` | 暴露 MCP API |
| `src/renderer/src/components/SettingsModal.tsx` | **新建**: 设置面板 Modal |
| `src/renderer/src/components/McpServerPanel.tsx` | **新建**: MCP 服务器管理 |
| `src/renderer/src/components/McpWhitelistPanel.tsx` | **新建**: 白名单管理 |
| `src/renderer/src/components/McpSelector.tsx` | **新建**: 输入区旁 MCP 开关面板 |
| `src/renderer/src/components/McpConfirmDialog.tsx` | **新建**: 工具调用确认弹窗 |
| `src/renderer/src/components/Sidebar.tsx` | ⚙ 设置入口 |
| `src/renderer/src/components/InputArea.tsx` | 🔌 MCP 选择器按钮 |
| `src/renderer/src/context/AppContext.tsx` | enabledMcp + setEnabledMcp 状态 |

## 测试结论

所有测试项通过，功能正常。
