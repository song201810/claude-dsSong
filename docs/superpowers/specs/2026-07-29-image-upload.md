# 图片上传功能 — 需求文档

**日期：** 2026-07-29  
**状态：** 待实现

## 功能概述

用户在输入区可以添加图片附件，发送时图片作为上下文传给 Claude CLI（`claude --image path.png -p "..."`）。

## 实现方案

### CLI 调用方式

Claude CLI 支持 `--image` 参数传入图片：
```
claude --image /path/to/photo.png -p "分析这张图片" --model ...
```

需要新增 IPC 通道 `app:select-image`，调用 `dialog.showOpenDialog` 限制图片文件格式。

### 数据模型变更

```typescript
// SendMessageParams 新增
export interface SendMessageParams {
  // ...existing fields...
  images?: string[]  // 本地图片绝对路径
}
```

### UI 设计

- **图片区域**：输入框上方出现已选图片的缩略图列表
- **添加按钮**：输入区左侧加一个 📎 图标按钮
- **删除图片**：缩略图右上角 × 按钮

```
┌─────────────────────────────────────────────┐
│  [📎]  [缩略图1 ×] [缩略图2 ×]               │
│  [输入框....................................] │
└─────────────────────────────────────────────┘
```

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | SendMessageParams 加 images 字段 |
| `src/main/ipc-handlers.ts` | 新增 app:select-image handler |
| `src/preload/index.ts` | 暴露 selectImage API |
| `src/main/claude-manager.ts` | args 中拼接 --image 参数 |
| `src/renderer/src/components/InputArea.tsx` | 图片缩略图列表 + 添加按钮 |
| `src/renderer/src/context/AppContext.tsx` | 管理 images 状态 |

## 图片存储

图片不复制、不存储到应用数据目录。直接用原始路径传给 CLI，由 CLI 自己处理。缩略图用 `file://` + `<img>` 本地渲染。

## 任务拆分

| # | 任务 | 预估 |
|---|------|------|
| 1 | IPC 通道 + 类型变更（select-image handler + SendMessageParams.images） | 小 |
| 2 | CLI arg 拼接（--image 参数） | 小 |
| 3 | 输入区 UI 改造（缩略图 + 添加/删除） | 中 |
| 4 | 状态管理（selectedImages state + 清理逻辑） | 小 |
| 5 | 测试 + 文档 | 小 |
