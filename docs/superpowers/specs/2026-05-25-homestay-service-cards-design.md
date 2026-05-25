# 民宿客人服务卡片系统 — 设计文档

## 概述

为民宿经营者提供一套移动端优先的服务卡片页面 + 简易后台管理系统。客人扫码即可查看民宿信息、入住指引、周边攻略等，提升入住体验和复购率。测试版先做单店，架构预留多店扩展。

## 技术选型

- **后端**: Express (两个实例，端口 3000 / 3001)
- **前端/后台**: 单文件 HTML + 内嵌 CSS/JS，零构建工具
- **存储**: JSON 文件 (`data/` 目录)
- **图片**: multer 文件上传 (`uploads/` 目录)
- **启动**: `concurrently` 同时启动两个服务

## 设计系统（Airbnb × Claude 融合）

### 色彩

| Token | 值 | 用途 |
|---|---|---|
| `--canvas` | `#fefaf6` | 页面底色，暖奶油白 |
| `--surface-card` | `#fffbf7` | 卡片底色 |
| `--surface-soft` | `#faf3eb` | 模块间隔带 |
| `--primary` | `#d4896a` | 暖陶土色 CTA |
| `--primary-active` | `#b86d4f` | 按下态 |
| `--ink` | `#2c2420` | 主文字 |
| `--body` | `#5c4f48` | 正文 |
| `--muted` | `#8c7b72` | 辅助文字 |
| `--hairline` | `#e8ddd4` | 分割线 |
| `--accent-green` | `#7da891` | 自然绿点缀 |

### 圆角

```
xs: 4px / sm: 8px / md: 14px / lg: 20px / xl: 32px / full: 9999px
```

### 字体

```
标题: "Noto Serif SC", "Source Han Serif SC", serif
正文: -apple-system, "PingFang SC", system-ui, sans-serif
```

### 间距

8px 基准，section 间距 64px。

### 阴影

单阴影策略：`box-shadow: 0 2px 6px rgba(44,36,32,0.04), 0 4px 8px rgba(44,36,32,0.06)` — 仅卡片 hover 时使用。

### 模块配色节奏

纯白和暖灰交替，每屏视觉断句：

1. 民宿简介 → canvas
2. 入住导引 → surface-soft
3. 景区攻略 → canvas
4. 到达路线 → surface-soft
5. 周边小吃 → canvas
6. 民宿好物 → surface-soft
7. 温馨提示 → canvas
8. 留言板 → surface-soft

## 数据模型

```
data/
├── homestay.json      # { name, logo, coverImage, description, tags[] }
├── guide.json          # { steps: [{ title, description, image }] }
├── attractions.json    # { items: [{ name, description, image }] }
├── routes.json         # { items: [{ from, method, description }] }
├── food.json           # { items: [{ name, dish, description, lat, lng }] }
├── products.json       # { items: [{ name, price, description, image, active, wechat, phone }] }
├── tips.json           # { wifi, wifiPassword, checkOutTime, notices[], emergencyPhone }
└── messages.json       # [{ id, content, createdAt }]
```

## API 设计

### 前端服务 (端口 3000)

```
GET  /api/homestay        → 民宿简介
GET  /api/guide           → 入住导引
GET  /api/attractions     → 景区攻略
GET  /api/routes          → 到达路线
GET  /api/food            → 周边小吃
GET  /api/products        → 好物（仅 active=true）
GET  /api/tips            → 温馨提示
GET  /api/messages        → 留言列表（最新 50 条）
POST /api/messages        → 提交留言
```

静态文件：`/uploads/` 图片目录

### 后台服务 (端口 3001)

```
GET  /api/admin/:module        → 读取模块数据
PUT  /api/admin/:module        → 更新模块数据
POST /api/admin/upload         → 上传图片
DELETE /api/admin/messages/:id → 删除留言
```

## 前端页面结构

移动端优先（375px），自适应到桌面。一页到底，8 个 section。

### 1. 民宿简介 (Hero)
- 封面大图 + 暖色渐变遮罩
- 民宿名：衬线体 28px/700
- 一句话简介
- 特色标签：pill badge，暖陶土描边，横排可滚动

### 2. 入住导引
- 竖排步骤列表
- 左侧大数字（衬线体，64px，极淡色 `--hairline`）
- 右侧：标题 + 描述 + 小图（14px 圆角）

### 3. 景区攻略
- 横向滑动卡片（移动端）/ 3 列 grid（桌面端）
- 每张：图片 → 名称 → 简短描述
- 景区导览图占位：一张可替换的大图

### 4. 到达路线
- 卡片列表，每张：出发地 → 交通方式 → 路线说明
- 一键导航按钮：pill 形状，根据设备自动打开高德/百度/Apple Maps

### 5. 周边小吃
- 卡片列表，每家：食物 emoji/图标 → 店名 → 推荐菜 → 描述
- 📍定位按钮：跳转地图导航到该店

### 6. 民宿好物
- 2 列网格（移动端）/ 3-4 列（桌面端）
- photo-first 卡片：图片 → 名称 → 价格（primary 色） → "购买" pill 按钮
- 点击购买 → 弹窗：📱微信联系（复制微信号）/ 📞电话联系（直接拨打）

### 7. 温馨提示
- 信息列表，每项带图标
- WiFi 名称密码、退房时间、入住须知、紧急联系电话

### 8. 留言板
- 输入框 + 提交按钮
- 提交后显示"收到您的反馈了 💚"
- 历史留言跑马灯：surface-soft 横条，文字缓慢左滚

## 后台管理页面结构

- 左侧模块导航（桌面端）/ 顶部 tab 选择（移动端）
- 右侧表单区，8 个 tab 对应 8 个模块
- 文件上传按钮，标注推荐尺寸
- 商品支持上架/下架切换
- 留言管理：列表 + 删除按钮，留言多时自动滚动
- 保存按钮，调用对应 API

## 文件结构

```
homestay-service-cards/
├── package.json
├── server.js              # 前端服务 (port 3000)
├── admin-server.js         # 后台服务 (port 3001)
├── data/                   # JSON 数据文件（带初始占位数据）
│   ├── homestay.json
│   ├── guide.json
│   ├── attractions.json
│   ├── routes.json
│   ├── food.json
│   ├── products.json
│   ├── tips.json
│   └── messages.json
├── uploads/                # 上传图片目录（.gitkeep）
├── public/
│   └── index.html          # 前端页面（内嵌 CSS/JS）
└── admin/
    └── index.html          # 后台管理（内嵌 CSS/JS）
```

## 启动方式

```bash
npm install
npm run dev    # concurrently 启动 3000 + 3001
```

## 占位数据

所有民宿名称、内容、商品数据使用通用占位符（如"山居小筑"、"欢迎来到我们的民宿"等），方便替换。

## 多店扩展预留

- 数据文件按 `data/<shopId>/` 组织
- API 路径预留 `/:shopId` 前缀（当前版本默认单店）
- 后续只需加路由中间件即可拆分

## 边界与限制

- 测试版无登录/鉴权
- JSON 文件存储，无并发写入保护，适合单用户后台编辑
- 图片上传限制 5MB，支持 jpg/png/webp
- 留言无分页，最多返回 50 条
