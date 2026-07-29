# 08-renderer-entry-test — 渲染进程入口 测试

**日期：** 2026-07-29

## 测试内容

1. index.html 正确引用 main.tsx
2. main.tsx ReactDOM.createRoot 渲染 App
3. AppContext useReducer + Context 全局状态
4. IPC 事件监听 (onChatToken/onChatError/onChatDone)
5. 初始化加载 sessions + models

## 测试步骤

1. 运行 tsc --noEmit -p tsconfig.web.json
2. npm run dev 启动，检查窗口显示
3. 检查控制台无 React 渲染错误
4. 检查侧栏加载空会话列表
5. 检查模型下拉加载 4 个默认模型

## 预期结果

- 编译零错误
- 应用正常启动，UI 渲染完整
- 空状态页面显示 "开始对话" 引导

## 实际结果

- 第一次启动发现 main/index.ts 加载的是 data:text/html 占位符（Fix-001: 白屏修复）
- 修复后正常加载 React 渲染进程
- 后续发现 React 闭包 stale state 问题（Fix-008: useRef 解决）
- 配置模型默认值为 claude-sonnet-4-6

## 是否通过

✅ 通过（修复后）
