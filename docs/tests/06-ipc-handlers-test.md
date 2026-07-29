# 06-ipc-handlers-test — IPC 处理器 测试

**日期：** 2026-07-29

## 测试内容

1. session:list / session:create / session:get / session:delete 注册
2. chat:send / chat:cancel 注册 + Claude Manager 联动
3. session:append-message 内部通道
4. config:get-models / config:get-settings / config:update-settings 注册
5. app:get-info / app:select-directory 注册

## 测试步骤

1. 运行 tsc --noEmit -p tsconfig.node.json
2. 创建会话 → 确认 metadata.json + messages.jsonl 生成
3. 发送消息 → 确认 chat:send 触发 + chat:token 推送到渲染
4. 选择工作目录 → 确认系统文件夹对话框弹出
5. 获取模型列表 → 确认返回 4 个模型

## 预期结果

- 编译零错误
- 所有 IPC 通道正确注册和处理

## 实际结果

- 编译零错误
- chat:send 之前加了 console.log 调试（事后已清理）
- 所有 session/chat/config/app 通道正常工作

## 是否通过

✅ 通过
