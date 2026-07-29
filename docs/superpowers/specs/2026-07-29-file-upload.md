# 文件上传功能 — 需求文档

**日期：** 2026-07-29  
**状态：** 待实现

## 功能概述

用户在输入区可附加图片（png/jpg/gif/webp/svg）和文档（pdf/txt/md/json/csv），发送时文件路径通过 CLI 参数传给 Claude。Claude CLI 通过文件路径读取内容，支持的文件类型由 CLI 内部处理。

## 支持的文件类型

| 类别 | 扩展名 |
|------|--------|
| 图片 | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` |
| 文档 | `.pdf` `.txt` `.md` `.json` `.csv` `.ts` `.js` `.py` `.html` `.css` |

## 实现方案

### CLI 调用方式

图片和文档统一通过 `--file`（或区分 `--image`）传入：

**首次发现**：Claude CLI 对图片用 `--image`，对文本文件可以直接 pipe 或 `--input-file`。调研后决定用统一策略：

```
# 先检查文件类型，图片用 --image，其他通过 --file 传入
claude --image photo.png --file readme.md -p "分析这些文件" --model ...
```

**注意**：需要 CLI 版本确认 `--file` 是否支持。若不支持，文本文件内容可通过 stdin pipe 或在消息提示词中引用文件路径让 CLI 自己读。

**结论**（根据 claude-libre 参考）：
- 图片：`--image <path>` （CLI 已支持）
- 文本文件：直接在 prompt 中提到 `@file:path` 格式，CLI 会自动通过 `@` 引用读取（CLI 自带文件引用能力）

### 数据模型变更

```typescript
// SendMessageParams 新增
export interface SendMessageParams {
  // ...existing fields...
  attachedFiles?: string[]  // 附件的本地绝对路径
}

// 新增 IPC 通道
APP_SELECT_FILES: 'app:select-files'
```

### UI 设计

```
┌─────────────────────────────────────────────┐
│  [📎]  [🖼️ photo.jpg ×] [📄 readme.md ×]    │
│  [输入框....................................] │
└─────────────────────────────────────────────┘
```

- **文件标签**：图片显示 🖼️ + 文件名，文档显示 📄 + 文件名
- **图标**：图片类型用缩略图预览（`file://` + `<img>`），文档用文件类型图标
- **添加按钮**：📎 点击 → 系统文件对话框（多选），filter 为图片+文档

### 文件对话框 filter

```typescript
dialog.showOpenDialog({
  properties: ['openFile', 'multiSelections'],
  filters: [
    { name: '图片和文档', extensions: ['png','jpg','jpeg','gif','webp','svg','pdf','txt','md','json','csv','ts','js','py','html','css'] },
    { name: '图片', extensions: ['png','jpg','jpeg','gif','webp','svg'] },
    { name: '文档', extensions: ['pdf','txt','md','json','csv','ts','js','py','html','css'] },
    { name: '所有文件', extensions: ['*'] },
  ]
})
```

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | SendMessageParams 加 attachedFiles；IPC 通道新增 APP_SELECT_FILES |
| `src/main/ipc-handlers.ts` | app:select-files handler（替换原 app:select-image） |
| `src/preload/index.ts` | selectFiles API |
| `src/main/claude-manager.ts` | 根据文件类型分流：图片 → --image，其他 → CLI @ 引用 |
| `src/renderer/src/components/InputArea.tsx` | 文件标签列表 + 添加/删除 + 缩略图预览 |
| `src/renderer/src/components/FileAttachment.tsx` | 新建：单个文件标签组件（图标 + 文件名 + 删除按钮） |
| `src/renderer/src/context/AppContext.tsx` | attachedFiles 状态管理 |

## 任务拆分

| # | 任务 | 预估 |
|---|------|------|
| 1 | 类型 + IPC 通道（app:select-files multiSelect） | 小 |
| 2 | CLI arg 拼接（图片 → --image，文本 @file 提示） | 小 |
| 3 | FileAttachment 组件 + 缩略图（图片）/ 文件图标（文档） | 中 |
| 4 | InputArea 集成（标签列表 + 添加按钮 + 删除交互） | 中 |
| 5 | 状态管理（attachedFiles state + 清除逻辑） | 小 |
| 6 | 测试 + 文档 | 小 |
