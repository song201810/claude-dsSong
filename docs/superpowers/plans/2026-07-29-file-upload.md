# 文件上传功能 — 实现计划

> **日期：** 2026-07-30  
> **目标：** 附件面板 + 文件选择 + CLI 参数拼接 + UI 交互

## 受影响文件

| 文件 | 角色 |
|------|------|
| `src/shared/types.ts` | SendMessageParams 加 attachedFiles + APP_SELECT_FILES 通道 |
| `src/main/ipc-handlers.ts` | app:select-files handler (multiSelect dialog) |
| `src/preload/index.ts` | selectFiles API |
| `src/main/claude-manager.ts` | 图片 → --image, 文本 → @file:<path> 拼入 prompt |
| `src/renderer/src/components/FileAttachment.tsx` | **新建**: 文件标签组件 |
| `src/renderer/src/components/InputArea.tsx` | 文件标签行 + 📎 按钮 |
| `src/renderer/src/context/AppContext.tsx` | attachedFiles 状态 |

## 任务拆分

- [x] 1. 类型 + IPC 通道
- [x] 2. CLI 参数拼接
- [x] 3. FileAttachment 组件
- [x] 4. InputArea 集成
- [x] 5. 状态管理
- [x] 6. 测试 + 文档
