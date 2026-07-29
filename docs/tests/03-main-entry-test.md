# 03-main-entry-test — 主进程入口 + 路径工具 测试

**日期：** 2026-07-29

## 测试内容

1. src/main/path-utils.ts 路径工具编译
2. src/main/index.ts Electron 入口编译
3. registerIpcHandlers 注册

## 测试步骤

1. 确认 path-utils.ts 所有函数导出正确
2. 确认 main/index.ts 中 createWindow() 和 registerIpcHandlers() 调用正确
3. 运行 tsc --noEmit -p tsconfig.node.json

## 预期结果

- 编译无类型错误
- path-utils 函数：getAppDataDir / getSessionsDir / getSessionDir / getSessionMetadataPath / getSessionMessagesPath / getSettingsPath

## 实际结果

编译零错误，所有函数导出正确。

## 是否通过

✅ 通过
