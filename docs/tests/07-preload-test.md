# 07-preload-test — Preload 脚本 测试

**日期：** 2026-07-29

## 测试内容

1. contextBridge.exposeInMainWorld('api', ...) 暴露所有 API
2. 会话 API: listSessions / createSession / getSession / deleteSession / appendMessage
3. 聊天 API: sendMessage / cancelChat / onChatToken / onChatError / onChatDone
4. 配置 API: getModels / getSettings / updateSettings
5. 应用 API: getAppInfo / selectDirectory

## 测试步骤

1. 运行 tsc --noEmit -p tsconfig.node.json
2. 检查 preload/index.ts 编译
3. 浏览器 devtools 中检查 window.api 对象

## 预期结果

- 编译零错误
- contextBridge 正确暴露所有 API
- 渲染进程可以访问 window.api

## 实际结果

- 编译零错误
- 所有 API 正确暴露
- appendMessage 作为内部通道使用 session:append-message 字符串常量

## 是否通过

✅ 通过
