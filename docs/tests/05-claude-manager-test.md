# 05-claude-manager-test — Claude CLI 进程管理器 测试

**日期：** 2026-07-29

## 测试内容

1. child_process.spawn 替代 node-pty（Fix-011）
2. CLI 参数构建（-p vs --continue）
3. ANSI 转义码清理
4. JSONL 行解析（parseJsonlLines）
5. stream-json 渐进式解析（assistant 事件 diff）
6. 错误处理（isClaudeAvailable + try/catch）

## 测试步骤

1. 运行 tsc --noEmit -p tsconfig.node.json
2. 检查 startChat 函数签名和 IPC 事件发送
3. 短消息测试：发送"你好" → 确认有 onChatToken + onChatDone
4. 长消息测试：发送"什么是Java" → 确认无 JSON 截断
5. 继续对话测试：同会话发两条消息 → 确认第二条有 --continue 参数
6. 未安装 claude 时：确认显示友好错误提示而非崩溃（Fix-003）

## 预期结果

- 编译零错误
- 短/长消息均正常流式显示
- 继续对话维持上下文
- 缺少 claude 时不会崩溃

## 实际结果

- 编译零错误
- child_process.spawn 解决了 pty 列宽截断问题（Fix-011: node-pty cols 无法阻止换行）
- 行解析改回 split('\n')，因为 child_process stdout 无终端处理
- --continue 参数在 `params.resume === true` 时正确传递
- isClaudeAvailable 检查 + try/catch 防止主进程崩溃

## 是否通过

✅ 通过
