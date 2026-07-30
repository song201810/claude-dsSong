# 文件上传功能 — 测试文档

**日期：** 2026-07-30  
**功能：** 输入区附件选择 + CLI 参数拼接

## 测试内容

| # | 测试项 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|---|--------|---------|---------|---------|------|
| 1 | 📎 按钮显示 | 进入会话 | 输入框左侧显示回形针图标按钮 | 按钮显示正常 | ✅ |
| 2 | 点击 📎 打开文件对话框 | 点击 📎 按钮 | 弹出系统文件选择对话框，可多选 | 对话框正常弹出 | ✅ |
| 3 | 选择图片文件 | 选择 png/jpg 文件 | 输入框上方显示 🖼️ + 文件名标签 | 标签显示正常 | ✅ |
| 4 | 选择文档文件 | 选择 pdf/txt/md 文件 | 输入框上方显示 📄 + 文件名标签 | 标签显示正常 | ✅ |
| 5 | 多选文件 | 同时选择多个文件 | 所有文件以标签形式展示 | 多个标签显示 | ✅ |
| 6 | 删除单个附件 | 点击标签上的 ✕ 按钮 | 该附件标签消失 | 标签移除正常 | ✅ |
| 7 | 发送消息包含附件 | 附加文件后发送消息 | 发送后附件标签清空 | 清空正常 | ✅ |
| 8 | CLI --image 参数（图片） | 附加图片发送 | CLI 命令包含 `--image <path>` | 参数正确拼接 | ✅ |
| 9 | CLI @file 参数（文档） | 附加文档发送 | prompt 中包含 `@file:<path>` | prompt 正确拼接 | ✅ |
| 10 | 发送后附件自动清空 | 发送消息 | 附件列表清空 | 清空正常 | ✅ |

## 改动文件清单

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | 新增 `APP_SELECT_FILES` 通道 + `SendMessageParams.attachedFiles` |
| `src/main/ipc-handlers.ts` | 新增 `app:select-files` handler (multiSelect dialog) |
| `src/preload/index.ts` | 暴露 `selectFiles` API |
| `src/main/claude-manager.ts` | 图片 → `--image`，文档 → prompt 中 `@file:<path>` |
| `src/renderer/src/components/FileAttachment.tsx` | **新建**：文件标签组件 |
| `src/renderer/src/components/InputArea.tsx` | 集成 📎 按钮 + 附件标签行 |
| `src/renderer/src/context/AppContext.tsx` | attachedFiles 状态 + add/remove actions |

## 实现要点

- 图片文件(png/jpg/gif/webp/svg) → CLI 使用 `--image <path>` 传递
- 文档文件(pdf/txt/md/json/csv/ts/js/py/html/css) → prompt 末尾追加 `@file:<path>` 引用
- FileAttachment 组件：🖼️ 图标(图片) / 📄 图标(文档) + 文件名 + ✕ 删除按钮
- 发送后自动清空 attachedFiles

## 测试结论

所有测试项通过，功能正常。
