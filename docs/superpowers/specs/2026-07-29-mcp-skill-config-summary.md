# MCP 配置功能 — 实现总结

**日期：** 2026-07-30

## 关键技术决策

1. **不使用自定义确认弹窗** — CLI 自己的交互式权限确认已经很好（Yes/Yes+don't ask again/No）。通过 `--allowedTools` 传递白名单工具名，CLI 自动跳过确认。不在白名单的工具由 CLI 自己的交互式提示处理。移除了 `McpConfirmDialog.tsx`。

2. **会话级 MCP 选择** — 用户在 McpSelector 中勾选 MCP 服务器 -> 发送时生成临时 JSON 写入 tmp 目录 -> 通过 `--strict-mcp-config --mcp-config <path>` 传给 CLI -> 只有选中的 MCP 可用。

3. **多来源 MCP 扫描** — mcp-manager.ts 从以下位置聚合：
   - `~/.claude/.mcp.json` (用户手动配置)
   - `~/.claude/plugins/*/` 中的 `.mcp.json` (插件 MCP，排除 cache 目录)
   - `~/plugins/*/` 中的 `.mcp.json` (直接安装的插件)
   - `~/.claude/.credentials.json` 中的 OAuth MCP (如 weather-mcp)

4. **白名单通过 CLI 原生机制生效** — `--allowedTools mcp__weather__get_weather,mcp__xxx` -> CLI 自动放行，不需要我们的 GUI 弹窗。
