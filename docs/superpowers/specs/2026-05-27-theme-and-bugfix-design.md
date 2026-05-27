# 宿说 · 主题系统 & Bug 修复设计

## 1. 概述

为宿说民宿服务卡片系统新增 3 套配色主题，支持商家后台切换；修复平台管理入驻申请重复拒绝的 Bug；重新设计客人扫码推荐页。

## 2. 配色方案

在 `design-system.css` 新增 3 个 theme class，与现有 `theme-warm` 机制一致。

### 2.1 日式侘寂 `theme-wabi`

| Token | Value |
|-------|-------|
| --primary | #7d8a76 (鼠尾草绿) |
| --primary-dark | #5b6b55 |
| --primary-bg | #f4f6f2 |
| --bg | #faf8f5 |
| --bg-alt | #f2f0ec |
| --surface | #fffdfa |
| --border | #e5e2dc |
| --ink | #2c2a26 |
| --ink-secondary | #4a4742 |
| --muted | #8c8984 |

### 2.2 新中式水墨 `theme-ink`

| Token | Value |
|-------|-------|
| --primary | #a0522d (赭石) |
| --primary-dark | #7a3a1e |
| --primary-bg | #fdf8f4 |
| --bg | #fefdf9 |
| --bg-alt | #f8f5f0 |
| --surface | #fffffe |
| --border | #e8e4dd |
| --ink | #1c1c1a |
| --ink-secondary | #3d3a35 |
| --muted | #8c8a85 |

### 2.3 现代清新 `theme-fresh`

| Token | Value |
|-------|-------|
| --primary | #c4956a (杏色) |
| --primary-dark | #a07850 |
| --primary-bg | #fef9f4 |
| --bg | #fefcf7 |
| --bg-alt | #faf6ef |
| --surface | #ffffff |
| --border | #efe8de |
| --ink | #2c2420 |
| --ink-secondary | #4a3f38 |
| --muted | #9c8f84 |

## 3. 数据库变更

`properties` 表新增 `theme` 字段，默认 `default`：

```sql
ALTER TABLE properties ADD COLUMN theme TEXT DEFAULT 'default';
```

可选值：`default`, `warm`, `wabi`, `ink`, `fresh`

## 4. 功能变更

### 4.1 Bug 修复：入驻申请一键拒绝/通过

**问题：** 同一商家多次申请后，按店名合并显示。拒绝只处理单条记录，同名其他待审核申请仍存在，导致按钮再次出现。

**修复：** `PUT /api/admin/applications/:id` 处理时，若该店名有其他 pending 申请也一并处理。

### 4.2 商家主题切换

- 商家后台 `property-admin.html` 新增主题选择器
- API `PUT /api/p/:slug/admin/modules` 已支持，扩展 `theme` 字段
- 客人端页面根据店铺 `theme` 自动应用对应 CSS class

### 4.3 客人扫码推荐页

重新设计 `property.html`，作为商家填写信息后的最终展示页：
- 封面大图 + 店名
- 信息卡片（地址、联系方式）
- 推荐模块（导引、周边、美食等）
- 底部留言区
- 整体为精美展示效果

## 5. 涉及文件

| 文件 | 变更 |
|------|------|
| `design-system.css` | 新增 3 个 theme class |
| `db.js` | migration 新增 theme 字段 |
| `app.js` | 修复申请 Bug、API 支持 theme、客人页传 theme |
| `admin/index.html` | 拒绝 approve/reject 按钮不再反复出现 |
| `admin/property-admin.html` | 新增主题选择器 |
| `public/property.html` | 重新设计为精美展示页 |
| `public/landing.html` | 主题跟随（可选） |
