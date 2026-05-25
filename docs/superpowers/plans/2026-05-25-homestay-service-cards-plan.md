# 民宿客人服务卡片系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建移动端优先的民宿服务卡片前端页面 + 简易后台管理系统

**Architecture:** 两个 Express 服务（3000 客人端 / 3001 后台），各绑定一个内嵌 CSS/JS 的单文件 HTML。数据存 JSON 文件，图片用 multer 上传。零构建工具，npm run dev 同时启动。

**Tech Stack:** Node.js, Express, multer, concurrently. 纯 HTML/CSS/JS 无框架.

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "homestay-service-cards",
  "version": "1.0.0",
  "description": "民宿客人服务卡片系统",
  "scripts": {
    "dev": "concurrently \"node server.js\" \"node admin-server.js\"",
    "start:guest": "node server.js",
    "start:admin": "node admin-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: 创建 .gitignore**

```
node_modules/
uploads/*
!uploads/.gitkeep
```

- [ ] **Step 3: 创建 uploads/.gitkeep**

Run: `mkdir -p uploads && touch uploads/.gitkeep`

- [ ] **Step 4: 安装依赖**

Run: `cd /Users/yu./homestay-service-cards && npm install`
Expected: 无错误，node_modules 目录创建

- [ ] **Step 5: 提交**

```bash
git add package.json .gitignore uploads/.gitkeep
git commit -m "chore: scaffold project with package.json and .gitignore"
```

---

### Task 2: 初始占位数据

**Files:**
- Create: `data/homestay.json`
- Create: `data/guide.json`
- Create: `data/attractions.json`
- Create: `data/routes.json`
- Create: `data/food.json`
- Create: `data/products.json`
- Create: `data/tips.json`
- Create: `data/messages.json`

- [ ] **Step 1: 创建 data/homestay.json**

```json
{
  "name": "山居小筑",
  "logo": "",
  "coverImage": "",
  "description": "隐匿于青山绿水间的温暖居所，让每一次停留都成为美好回忆。",
  "tags": ["山景庭院", "亲子友好", "宠物可住", "农家早餐"]
}
```

- [ ] **Step 2: 创建 data/guide.json**

```json
{
  "steps": [
    { "title": "到达民宿入口", "description": "从主路右转进入石板小路，直行约50米即可看到'山居小筑'木牌。入口处有停车场标识。", "image": "" },
    { "title": "停车指南", "description": "入口左侧设有免费停车场，可停放6辆车。请按地面白线停靠，勿占用消防通道。", "image": "" },
    { "title": "前往前台", "description": "沿石板路步行约30米，穿过花园小径，前台位于右手边玻璃房内。", "image": "" },
    { "title": "入住办理", "description": "到达前台后告知预订姓名，管家会带您前往房间并介绍设施使用。如有需要门禁密码，管家会当面告知。", "image": "" }
  ]
}
```

- [ ] **Step 3: 创建 data/attractions.json**

```json
{
  "items": [
    { "name": "白云山风景区", "description": "国家5A级景区，以奇峰怪石、云海日出闻名，距民宿仅15分钟车程。", "image": "" },
    { "name": "古镇老街", "description": "保存完好的明清古建筑群，青石板路两旁遍布茶馆和手工艺品店。", "image": "" },
    { "name": "竹海漂流", "description": "全长3公里的竹林漂流，夏季清凉首选，适合全家游玩。", "image": "" },
    { "name": "茶园采摘体验", "description": "亲手采摘当季新茶，体验制茶全过程，品尝现泡香茗。", "image": "" }
  ],
  "guideMapImage": ""
}
```

- [ ] **Step 4: 创建 data/routes.json**

```json
{
  "items": [
    { "from": "✈️ 机场", "method": "打车/自驾", "description": "机场高速出口右转，沿G104国道行驶约40分钟，导航搜索'山居小筑'即可到达。全程约45公里。" },
    { "from": "🚄 高铁站", "method": "打车/公交", "description": "出站后乘坐K12路公交至'白云路口'站下车，步行5分钟即到。打车约20分钟，费用约30元。" },
    { "from": "🚗 自驾", "method": "自驾", "description": "导航搜索'山居小筑'，G104国道白云出口下，沿景区指示牌行驶约5公里即到。民宿设有免费停车场。" }
  ]
}
```

- [ ] **Step 5: 创建 data/food.json**

```json
{
  "items": [
    { "name": "老王农家菜", "dish": "土鸡炖蘑菇、竹笋炒腊肉", "description": "开了二十年的老店，食材全部自产，土鸡现杀现炖，汤鲜味浓。", "lat": 30.1234, "lng": 119.5678 },
    { "name": "小溪面馆", "dish": "手工擀面、牛肉面", "description": "门口小溪流过，坐在溪边吃面的体验独一无二。手工擀面劲道十足。", "lat": 30.1250, "lng": 119.5700 },
    { "name": "阿婆豆腐坊", "dish": "石磨豆腐花、臭豆腐", "description": "阿婆每天凌晨起来用石磨磨豆浆，豆腐花嫩滑如脂，配上自制辣椒酱绝了。", "lat": 30.1220, "lng": 119.5650 },
    { "name": "山间烧烤", "dish": "烤羊排、烤鱼、烤蔬菜", "description": "露天烧烤，坐在山顶看日落吃烧烤，需要提前一天预约。", "lat": 30.1280, "lng": 119.5720 }
  ]
}
```

- [ ] **Step 6: 创建 data/products.json**

```json
{
  "items": [
    { "name": "手工蜂蜜", "price": 68, "description": "自家蜂场采集的百花蜜，纯天然无添加，500g装。", "image": "", "active": true, "wechat": "homestay_shop", "phone": "13800001234" },
    { "name": "竹编制品", "price": 128, "description": "本地老手艺人手工编织的竹篮，每个独一无二。", "image": "", "active": true, "wechat": "homestay_shop", "phone": "13800001234" },
    { "name": "高山茶叶", "price": 198, "description": "海拔800米以上茶园采摘，清香回甘，250g礼盒装。", "image": "", "active": true, "wechat": "homestay_shop", "phone": "13800001234" },
    { "name": "手工皂礼盒", "price": 88, "description": "天然植物精油手工皂，4块装礼盒，适合送礼。", "image": "", "active": true, "wechat": "homestay_shop", "phone": "13800001234" },
    { "name": "民宿定制明信片", "price": 25, "description": "民宿周边风景手绘明信片，6张套装。", "image": "", "active": true, "wechat": "homestay_shop", "phone": "13800001234" },
    { "name": "本地特产零食礼包", "price": 158, "description": "精选6种本地特色零食，独立包装，方便携带。", "image": "", "active": false, "wechat": "homestay_shop", "phone": "13800001234" }
  ]
}
```

- [ ] **Step 7: 创建 data/tips.json**

```json
{
  "wifi": "ShanJu_5G",
  "wifiPassword": "welcome2024",
  "checkOutTime": "12:00 前退房",
  "notices": ["请勿在室内吸烟", "23:00后请保持安静，尊重邻里休息", "厨房使用后请自行清理", "离开房间请关闭空调和灯光", "宠物请勿上床，院子内可自由活动"],
  "emergencyPhone": "13800009999"
}
```

- [ ] **Step 8: 创建 data/messages.json**

```json
[
  { "id": "m001", "content": "太喜欢这里了，下次还来！", "createdAt": "2026-05-20T10:30:00Z" },
  { "id": "m002", "content": "老板人很好，早餐超好吃", "createdAt": "2026-05-18T14:20:00Z" },
  { "id": "m003", "content": "房间很干净，山景太美了", "createdAt": "2026-05-15T09:15:00Z" }
]
```

- [ ] **Step 9: 提交**

```bash
git add data/
git commit -m "feat: add placeholder data files for all 8 modules"
```

---

### Task 3: 前端服务 (server.js)

**Files:**
- Create: `server.js`

- [ ] **Step 1: 创建 server.js**

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

function readData(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}

// 民宿简介
app.get('/api/homestay', (_req, res) => {
  res.json(readData('homestay.json'));
});

// 入住导引
app.get('/api/guide', (_req, res) => {
  res.json(readData('guide.json'));
});

// 景区攻略
app.get('/api/attractions', (_req, res) => {
  res.json(readData('attractions.json'));
});

// 到达路线
app.get('/api/routes', (_req, res) => {
  res.json(readData('routes.json'));
});

// 周边小吃
app.get('/api/food', (_req, res) => {
  res.json(readData('food.json'));
});

// 民宿好物 (仅 active)
app.get('/api/products', (_req, res) => {
  const data = readData('products.json');
  res.json({ items: data.items.filter(p => p.active) });
});

// 温馨提示
app.get('/api/tips', (_req, res) => {
  res.json(readData('tips.json'));
});

// 留言
app.get('/api/messages', (_req, res) => {
  const data = readData('messages.json');
  res.json(data.slice(-50));
});

app.post('/api/messages', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '留言内容不能为空' });
  }
  const messages = readData('messages.json');
  const msg = {
    id: 'm' + Date.now(),
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  messages.push(msg);
  fs.writeFileSync(path.join(DATA_DIR, 'messages.json'), JSON.stringify(messages, null, 2));
  res.json({ success: true, message: msg });
});

app.listen(PORT, () => {
  console.log(`🏡 民宿服务卡片前端: http://localhost:${PORT}`);
});
```

- [ ] **Step 2: 验证服务启动**

Run: `cd /Users/yu./homestay-service-cards && node server.js &`
然后 `curl http://localhost:3000/api/homestay`
Expected: 返回 homestay.json 的内容
Run: `kill %1` 关闭

- [ ] **Step 3: 提交**

```bash
git add server.js
git commit -m "feat: add guest-facing Express server on port 3000"
```

---

### Task 4: 后台服务 (admin-server.js)

**Files:**
- Create: `admin-server.js`

- [ ] **Step 1: 创建 admin-server.js**

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();

const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const VALID_MODULES = ['homestay', 'guide', 'attractions', 'routes', 'food', 'products', 'tips'];

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'admin')));

// 图片上传
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/webp 格式'));
    }
  }
});

function readData(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}

function writeData(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// 上传图片
app.post('/api/admin/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// 读取模块数据
app.get('/api/admin/:module', (req, res) => {
  const mod = req.params.module;
  if (mod === 'messages') {
    return res.json(readData('messages.json'));
  }
  if (!VALID_MODULES.includes(mod)) {
    return res.status(404).json({ error: '模块不存在' });
  }
  res.json(readData(mod + '.json'));
});

// 更新模块数据
app.put('/api/admin/:module', (req, res) => {
  const mod = req.params.module;
  if (!VALID_MODULES.includes(mod)) {
    return res.status(404).json({ error: '模块不存在' });
  }
  writeData(mod + '.json', req.body);
  res.json({ success: true });
});

// 删除留言
app.delete('/api/admin/messages/:id', (req, res) => {
  const messages = readData('messages.json');
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '留言不存在' });
  messages.splice(idx, 1);
  writeData('messages.json', messages);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`⚙️  民宿后台管理: http://localhost:${PORT}`);
});
```

- [ ] **Step 2: 验证后台服务启动**

Run: `cd /Users/yu./homestay-service-cards && node admin-server.js &`
然后 `curl http://localhost:3001/api/admin/homestay`
Expected: 返回 homestay.json 的内容
Run: `kill %1` 关闭

- [ ] **Step 3: 提交**

```bash
git add admin-server.js
git commit -m "feat: add admin Express server on port 3001 with file upload"
```

---

### Task 5: 客人前端页面 (public/index.html)

**Files:**
- Create: `public/index.html`

这是最大的任务，包含完整的内嵌 CSS + HTML 结构 + JavaScript。

- [ ] **Step 1: CSS 设计系统 — CSS 变量与全局样式**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>山居小筑 - 服务卡片</title>
  <style>
    :root {
      --canvas: #fefaf6;
      --surface-card: #fffbf7;
      --surface-soft: #faf3eb;
      --primary: #d4896a;
      --primary-active: #b86d4f;
      --ink: #2c2420;
      --body: #5c4f48;
      --muted: #8c7b72;
      --hairline: #e8ddd4;
      --accent-green: #7da891;

      --rounded-sm: 8px;
      --rounded-md: 14px;
      --rounded-lg: 20px;
      --rounded-xl: 32px;
      --rounded-full: 9999px;

      --shadow-card: 0 2px 6px rgba(44,36,32,0.04), 0 4px 8px rgba(44,36,32,0.06);

      --font-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
      --font-sans: -apple-system, "PingFang SC", system-ui, sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-sans);
      background: var(--canvas);
      color: var(--body);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .container { max-width: 768px; margin: 0 auto; padding: 0 20px; }

    section { padding: 64px 0; }

    section:nth-child(even) { background: var(--surface-soft); }
    section:nth-child(odd) { background: var(--canvas); }

    .section-title {
      font-family: var(--font-serif);
      font-size: 22px;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 8px;
    }

    .section-subtitle {
      font-size: 14px;
      color: var(--muted);
      margin-bottom: 32px;
    }

    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--primary); color: #fff;
      font-size: 14px; font-weight: 500;
      padding: 10px 20px; border-radius: var(--rounded-full);
      border: none; cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: var(--primary-active); }

    .card {
      background: var(--surface-card);
      border-radius: var(--rounded-md);
      padding: 20px;
      border: 1px solid var(--hairline);
    }
    .card:hover { box-shadow: var(--shadow-card); }

    .pill-tag {
      display: inline-block;
      font-size: 13px; font-weight: 500; color: var(--primary);
      padding: 4px 14px;
      border: 1px solid var(--primary);
      border-radius: var(--rounded-full);
    }

    .marquee {
      overflow: hidden; white-space: nowrap;
      background: var(--surface-soft);
      border-radius: var(--rounded-sm);
      padding: 12px 16px;
    }
    .marquee-inner {
      display: inline-block;
      animation: marquee 30s linear infinite;
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  </style>
</head>
<body>
```

- [ ] **Step 2: HTML 结构 — Section 1 民宿简介 Hero**

```html
  <section id="homestay">
    <div class="container">
      <div style="position:relative;border-radius:var(--rounded-lg);overflow:hidden;background:linear-gradient(135deg, #f5e6d8 0%, #e8d5c4 40%, #c9a88c 100%);min-height:280px;display:flex;align-items:center;justify-content:center;">
        <div style="text-align:center;padding:48px 24px;">
          <div id="coverPreview" style="font-size:64px;margin-bottom:16px;">🏡</div>
          <h1 id="homestayName" style="font-family:var(--font-serif);font-size:28px;font-weight:700;color:var(--ink);">山居小筑</h1>
          <p id="homestayDesc" style="color:var(--body);margin-top:8px;max-width:400px;">隐匿于青山绿水间的温暖居所</p>
          <div id="homestayTags" style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;"></div>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: HTML 结构 — Section 2 入住导引**

```html
  <section id="guide">
    <div class="container">
      <h2 class="section-title">🚪 入住导引</h2>
      <p class="section-subtitle">跟着步骤走，轻松找到我们</p>
      <div id="guideSteps" style="display:flex;flex-direction:column;gap:24px;"></div>
    </div>
  </section>
```

- [ ] **Step 4: HTML 结构 — Section 3 景区攻略**

```html
  <section id="attractions">
    <div class="container">
      <h2 class="section-title">🗺️ 景区攻略</h2>
      <p class="section-subtitle">周边好玩的地方</p>
      <div id="attractionCards" style="display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;"></div>
      <div id="guideMap" style="margin-top:24px;"></div>
    </div>
  </section>
```

- [ ] **Step 5: HTML 结构 — Section 4 到达路线**

```html
  <section id="routes">
    <div class="container">
      <h2 class="section-title">📍 到达路线</h2>
      <p class="section-subtitle">多种方式，轻松抵达</p>
      <div id="routeCards" style="display:flex;flex-direction:column;gap:16px;"></div>
    </div>
  </section>
```

- [ ] **Step 6: HTML 结构 — Section 5 周边小吃**

```html
  <section id="food">
    <div class="container">
      <h2 class="section-title">🍜 周边小吃推荐</h2>
      <p class="section-subtitle">本地人都在吃的老店</p>
      <div id="foodCards" style="display:flex;flex-direction:column;gap:16px;"></div>
    </div>
  </section>
```

- [ ] **Step 7: HTML 结构 — Section 6 民宿好物 + 购买弹窗**

```html
  <section id="products">
    <div class="container">
      <h2 class="section-title">🛍️ 民宿好物</h2>
      <p class="section-subtitle">把山居的味道带回家</p>
      <div id="productGrid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;"></div>
    </div>
  </section>

  <div id="buyModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;align-items:flex-end;justify-content:center;">
    <div style="background:var(--surface-card);border-radius:var(--rounded-lg) var(--rounded-lg) 0 0;padding:24px;width:100%;max-width:420px;">
      <h3 id="modalProductName" style="font-family:var(--font-serif);font-size:18px;color:var(--ink);margin-bottom:16px;"></h3>
      <button class="btn-primary" style="width:100%;margin-bottom:12px;" id="btnWechat">📱 微信联系（复制微信号）</button>
      <button class="btn-primary" style="width:100%;background:var(--accent-green);" id="btnPhone">📞 电话联系（直接拨打）</button>
      <button style="width:100%;margin-top:12px;padding:10px;background:none;border:1px solid var(--hairline);border-radius:var(--rounded-full);color:var(--muted);cursor:pointer;" onclick="closeModal()">取消</button>
    </div>
  </div>
```

- [ ] **Step 8: HTML 结构 — Section 7 温馨提示**

```html
  <section id="tips">
    <div class="container">
      <h2 class="section-title">💡 温馨提示</h2>
      <p class="section-subtitle">入住小贴士</p>
      <div id="tipsContent" style="display:flex;flex-direction:column;gap:12px;"></div>
    </div>
  </section>
```

- [ ] **Step 9: HTML 结构 — Section 8 留言板**

```html
  <section id="messages">
    <div class="container">
      <h2 class="section-title">📝 留言板</h2>
      <p class="section-subtitle">说说你的入住体验吧</p>
      <div style="display:flex;gap:8px;">
        <input id="msgInput" type="text" placeholder="想说点什么..." maxlength="200" style="flex:1;padding:12px 16px;border:1px solid var(--hairline);border-radius:var(--rounded-full);font-size:14px;font-family:var(--font-sans);outline:none;background:var(--surface-card);">
        <button class="btn-primary" onclick="submitMessage()">提交</button>
      </div>
      <p id="msgFeedback" style="color:var(--accent-green);margin-top:8px;font-size:13px;display:none;">收到您的反馈了 💚</p>
      <div class="marquee" style="margin-top:20px;">
        <div class="marquee-inner" id="marqueeContent"></div>
      </div>
    </div>
  </section>
```

- [ ] **Step 10: JavaScript — 数据获取与渲染**

```html
  <script>
    const API = '';

    async function fetchJSON(path) {
      const res = await fetch(API + path);
      return res.json();
    }

    // 民宿简介
    async function renderHomestay() {
      const data = await fetchJSON('/api/homestay');
      document.getElementById('homestayName').textContent = data.name;
      document.getElementById('homestayDesc').textContent = data.description;
      document.title = data.name + ' - 服务卡片';
      const tags = document.getElementById('homestayTags');
      tags.innerHTML = data.tags.map(t => `<span class="pill-tag">${t}</span>`).join('');
      if (data.coverImage) {
        document.getElementById('coverPreview').innerHTML = `<img src="${data.coverImage}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" alt="">`;
      }
    }

    // 入住导引
    async function renderGuide() {
      const data = await fetchJSON('/api/guide');
      const el = document.getElementById('guideSteps');
      el.innerHTML = data.steps.map((s, i) => `
        <div style="display:flex;gap:20px;align-items:flex-start;">
          <div style="font-family:var(--font-serif);font-size:64px;font-weight:700;color:var(--hairline);line-height:1;min-width:60px;text-align:center;">${String(i+1).padStart(2,'0')}</div>
          <div class="card" style="flex:1;">
            <h3 style="font-size:16px;font-weight:600;color:var(--ink);margin-bottom:4px;">${s.title}</h3>
            <p style="font-size:14px;color:var(--body);">${s.description}</p>
            ${s.image ? `<img src="${s.image}" style="width:100%;border-radius:var(--rounded-md);margin-top:12px;" alt="">` : ''}
          </div>
        </div>
      `).join('');
    }

    // 景区攻略
    async function renderAttractions() {
      const data = await fetchJSON('/api/attractions');
      const el = document.getElementById('attractionCards');
      el.innerHTML = data.items.map(a => `
        <div class="card" style="min-width:220px;scroll-snap-align:start;">
          <div style="width:100%;height:140px;background:var(--surface-soft);border-radius:var(--rounded-sm);display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:12px;">
            ${a.image ? `<img src="${a.image}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--rounded-sm);" alt="">` : '🏔️'}
          </div>
          <h3 style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:4px;">${a.name}</h3>
          <p style="font-size:13px;color:var(--muted);">${a.description}</p>
        </div>
      `).join('');
      if (data.guideMapImage) {
        document.getElementById('guideMap').innerHTML = `<img src="${data.guideMapImage}" style="width:100%;border-radius:var(--rounded-md);" alt="景区导览图">`;
      }
    }

    // 到达路线
    async function renderRoutes() {
      const data = await fetchJSON('/api/routes');
      const el = document.getElementById('routeCards');
      el.innerHTML = data.items.map(r => `
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:18px;">${r.from}</span>
            <span class="pill-tag" style="font-size:11px;padding:2px 10px;">${r.method}</span>
          </div>
          <p style="font-size:14px;color:var(--body);margin-bottom:12px;">${r.description}</p>
        </div>
      `).join('');
    }
```

- [ ] **Step 11: JavaScript — 一键导航（智能适配地图 App）**

```javascript
    function openMapNav(lat, lng, name) {
      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      // 优先高德地图
      if (isIOS) {
        window.location.href = `iosamap://path?sourceApplication=homestay&dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&dev=0&t=0`;
        setTimeout(() => {
          window.location.href = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&coordinate=gaode`;
        }, 500);
      } else {
        window.location.href = `amapuri://route/plan/?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&dev=0&t=0`;
        setTimeout(() => {
          window.location.href = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&coordinate=gaode`;
        }, 500);
      }
    }
```

- [ ] **Step 12: JavaScript — 周边小吃渲染 + 导航**

```javascript
    async function renderFood() {
      const data = await fetchJSON('/api/food');
      const el = document.getElementById('foodCards');
      const emojis = ['🥘','🍜','🫘','🥩'];
      el.innerHTML = data.items.map((f, i) => `
        <div class="card">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="font-size:36px;flex-shrink:0;">${emojis[i] || '🍽️'}</div>
            <div style="flex:1;">
              <h3 style="font-size:16px;font-weight:600;color:var(--ink);">${f.name}</h3>
              <p style="font-size:13px;color:var(--primary);margin:4px 0;">🏷️ ${f.dish}</p>
              <p style="font-size:13px;color:var(--body);margin-bottom:10px;">${f.description}</p>
              <button class="btn-primary" style="font-size:12px;padding:6px 16px;" onclick="openMapNav(${f.lat},${f.lng},'${f.name}')">📍 导航去这里</button>
            </div>
          </div>
        </div>
      `).join('');
    }
```

- [ ] **Step 13: JavaScript — 民宿好物渲染 + 购买弹窗**

```javascript
    let currentProduct = null;

    async function renderProducts() {
      const data = await fetchJSON('/api/products');
      const el = document.getElementById('productGrid');
      el.innerHTML = data.items.map(p => `
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="width:100%;height:160px;background:var(--surface-soft);display:flex;align-items:center;justify-content:center;font-size:40px;">
            ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;" alt="">` : '🎁'}
          </div>
          <div style="padding:14px;">
            <h3 style="font-size:14px;font-weight:600;color:var(--ink);">${p.name}</h3>
            <p style="font-size:12px;color:var(--muted);margin:4px 0;">${p.description}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
              <span style="font-size:16px;font-weight:700;color:var(--primary);">¥${p.price}</span>
              <button class="btn-primary" style="font-size:12px;padding:6px 16px;" onclick="openBuyModal('${p.name}','${p.wechat}','${p.phone}')">购买</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    function openBuyModal(name, wechat, phone) {
      currentProduct = { name, wechat, phone };
      document.getElementById('modalProductName').textContent = '购买 ' + name;
      document.getElementById('buyModal').style.display = 'flex';
      document.getElementById('btnWechat').onclick = () => {
        navigator.clipboard.writeText(wechat).then(() => alert('微信号已复制：' + wechat));
      };
      document.getElementById('btnPhone').onclick = () => {
        window.location.href = 'tel:' + phone;
      };
    }

    function closeModal() {
      document.getElementById('buyModal').style.display = 'none';
    }
```

- [ ] **Step 14: JavaScript — 温馨提示 + 留言板**

```javascript
    async function renderTips() {
      const data = await fetchJSON('/api/tips');
      const el = document.getElementById('tipsContent');
      el.innerHTML = `
        <div class="card" style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">📶</span>
          <div><strong style="color:var(--ink);">WiFi</strong><br><span style="font-size:14px;">${data.wifi} / 密码: ${data.wifiPassword}</span></div>
        </div>
        <div class="card" style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">🕐</span>
          <div><strong style="color:var(--ink);">退房时间</strong><br><span style="font-size:14px;">${data.checkOutTime}</span></div>
        </div>
        <div class="card" style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">📞</span>
          <div><strong style="color:var(--ink);">紧急联系电话</strong><br><span style="font-size:14px;">${data.emergencyPhone}</span></div>
        </div>
        <div class="card">
          <strong style="color:var(--ink);display:block;margin-bottom:8px;">📋 入住须知</strong>
          ${data.notices.map(n => `<p style="font-size:13px;color:var(--body);padding:4px 0;border-bottom:1px solid var(--hairline);">• ${n}</p>`).join('')}
        </div>
      `;
    }

    async function renderMessages() {
      const data = await fetchJSON('/api/messages');
      const marquee = document.getElementById('marqueeContent');
      const texts = data.map(m => `"${m.content}"`).join('  ·  ');
      marquee.textContent = texts + '  ·  ' + texts;
    }

    async function submitMessage() {
      const input = document.getElementById('msgInput');
      const content = input.value.trim();
      if (!content) return;
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      input.value = '';
      document.getElementById('msgFeedback').style.display = 'block';
      setTimeout(() => { document.getElementById('msgFeedback').style.display = 'none'; }, 3000);
      renderMessages();
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      renderHomestay();
      renderGuide();
      renderAttractions();
      renderRoutes();
      renderFood();
      renderProducts();
      renderTips();
      renderMessages();
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: 验证页面可访问**

Run: `cd /Users/yu./homestay-service-cards && node server.js &`
然后 `curl -s http://localhost:3000 | head -5`
Expected: 返回 HTML 内容
Run: `kill %1`

- [ ] **Step 3: 提交**

```bash
git add public/index.html
git commit -m "feat: add guest-facing service cards page with all 8 sections"
```

---

### Task 6: 后台管理页面 (admin/index.html)

**Files:**
- Create: `admin/index.html`

- [ ] **Step 1: 后台 HTML 结构 + CSS**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>民宿后台管理</title>
  <style>
    :root {
      --canvas: #fefaf6; --surface-card: #fffbf7; --surface-soft: #faf3eb;
      --primary: #d4896a; --primary-active: #b86d4f;
      --ink: #2c2420; --body: #5c4f48; --muted: #8c7b72; --hairline: #e8ddd4;
      --rounded-sm: 8px; --rounded-md: 14px; --rounded-full: 9999px;
      --font-sans: -apple-system, "PingFang SC", system-ui, sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-sans); background: var(--surface-soft); color: var(--body); display: flex; min-height: 100vh; }
    nav { width: 220px; background: var(--surface-card); border-right: 1px solid var(--hairline); padding: 20px 0; flex-shrink: 0; }
    nav h2 { font-size: 16px; color: var(--ink); padding: 0 20px 16px; }
    nav a { display: block; padding: 10px 20px; font-size: 14px; color: var(--body); text-decoration: none; border-left: 3px solid transparent; cursor: pointer; }
    nav a:hover, nav a.active { color: var(--primary); background: var(--surface-soft); border-left-color: var(--primary); }
    main { flex: 1; padding: 24px; overflow-y: auto; }
    .tab { display: none; }
    .tab.active { display: block; }
    h1 { font-size: 20px; color: var(--ink); margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px 14px; border: 1px solid var(--hairline); border-radius: var(--rounded-sm); font-size: 14px; font-family: var(--font-sans); background: var(--surface-card); }
    .form-group textarea { min-height: 80px; resize: vertical; }
    .btn { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: var(--rounded-full); border: none; cursor: pointer; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-active); }
    .btn-danger { background: #c64545; color: #fff; }
    .btn-outline { background: transparent; border: 1px solid var(--hairline); color: var(--body); }
    .img-preview { max-width: 200px; max-height: 120px; border-radius: var(--rounded-sm); margin-top: 8px; display: block; }
    .size-hint { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .dynamic-list { display: flex; flex-direction: column; gap: 12px; }
    .dynamic-item { background: var(--surface-soft); padding: 14px; border-radius: var(--rounded-sm); }
    .messages-list { max-height: 400px; overflow-y: auto; }
    .msg-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface-card); border-radius: var(--rounded-sm); margin-bottom: 8px; }
    .msg-item .content { flex: 1; font-size: 14px; }
    .msg-item .time { font-size: 12px; color: var(--muted); margin-right: 12px; }
    .toast { position: fixed; bottom: 24px; right: 24px; background: var(--ink); color: #fff; padding: 12px 24px; border-radius: var(--rounded-full); font-size: 14px; z-index: 999; display: none; }
    @media (max-width: 768px) { body { flex-direction: column; } nav { width: 100%; display: flex; overflow-x: auto; padding: 8px; } nav h2 { display: none; } nav a { flex-shrink: 0; border-left: none; border-bottom: 2px solid transparent; padding: 8px 12px; font-size: 13px; } nav a.active { border-left: none; border-bottom-color: var(--primary); } main { padding: 16px; } }
  </style>
</head>
<body>
  <nav>
    <h2>🏡 民宿后台</h2>
    <a data-tab="homestay" class="active" onclick="switchTab('homestay')">民宿简介</a>
    <a data-tab="guide" onclick="switchTab('guide')">入住导引</a>
    <a data-tab="attractions" onclick="switchTab('attractions')">景区攻略</a>
    <a data-tab="routes" onclick="switchTab('routes')">到达路线</a>
    <a data-tab="food" onclick="switchTab('food')">周边小吃</a>
    <a data-tab="products" onclick="switchTab('products')">民宿好物</a>
    <a data-tab="tips" onclick="switchTab('tips')">温馨提示</a>
    <a data-tab="messages" onclick="switchTab('messages')">留言管理</a>
  </nav>
  <main id="mainContent"></main>
  <div class="toast" id="toast"></div>
```

- [ ] **Step 2: 后台 JavaScript — Tab 切换与图片上传**

```html
  <script>
    const ADMIN_API = '';

    function switchTab(name) {
      document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
      document.querySelector(`[data-tab="${name}"]`).classList.add('active');
      loadTab(name);
    }

    function toast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg; el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 2000);
    }

    async function fetchJSON(path) {
      const res = await fetch(ADMIN_API + path);
      return res.json();
    }

    async function uploadImage(file) {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(ADMIN_API + '/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      return data.url;
    }
```

- [ ] **Step 3: 后台 JavaScript — 民宿简介 Tab**

```javascript
    async function loadHomestayTab() {
      const data = await fetchJSON('/api/admin/homestay');
      document.getElementById('mainContent').innerHTML = `
        <h1>🏡 民宿简介</h1>
        <div class="form-group"><label>民宿名称</label><input id="f_name" value="${esc(data.name)}"></div>
        <div class="form-group"><label>Logo 图片 <span class="size-hint">（推荐 200×200px）</span></label><input type="file" accept="image/*" onchange="previewAndUpload(this,'f_logo')"><input type="hidden" id="f_logo" value="${esc(data.logo)}"><img class="img-preview" id="preview_f_logo" src="${data.logo || ''}" style="${data.logo?'':'display:none'}"></div>
        <div class="form-group"><label>封面大图 <span class="size-hint">（推荐 750×500px）</span></label><input type="file" accept="image/*" onchange="previewAndUpload(this,'f_coverImage')"><input type="hidden" id="f_coverImage" value="${esc(data.coverImage)}"><img class="img-preview" id="preview_f_coverImage" src="${data.coverImage || ''}" style="${data.coverImage?'':'display:none'}"></div>
        <div class="form-group"><label>一句话简介</label><textarea id="f_description">${esc(data.description)}</textarea></div>
        <div class="form-group"><label>特色标签（每行一个）</label><textarea id="f_tags">${data.tags.join('\n')}</textarea></div>
        <button class="btn btn-primary" onclick="saveHomestay()">💾 保存</button>
      `;
    }

    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

    async function previewAndUpload(input, targetId) {
      if (!input.files[0]) return;
      const url = await uploadImage(input.files[0]);
      document.getElementById(targetId).value = url;
      const preview = document.getElementById('preview_' + targetId);
      if (preview) { preview.src = url; preview.style.display = 'block'; }
      toast('图片上传成功');
    }

    async function saveHomestay() {
      const data = {
        name: document.getElementById('f_name').value,
        logo: document.getElementById('f_logo').value,
        coverImage: document.getElementById('f_coverImage').value,
        description: document.getElementById('f_description').value,
        tags: document.getElementById('f_tags').value.split('\n').filter(t => t.trim())
      };
      await fetch(ADMIN_API + '/api/admin/homestay', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      toast('保存成功');
    }
```

- [ ] **Step 4: 后台 JavaScript — 入住导引 Tab（动态步骤）**

```javascript
    async function loadGuideTab() {
      const data = await fetchJSON('/api/admin/guide');
      let html = `<h1>🚪 入住导引</h1><div class="dynamic-list" id="guideList">`;
      data.steps.forEach((s, i) => {
        html += `
          <div class="dynamic-item">
            <strong>步骤 ${i + 1}</strong>
            <div class="form-group"><label>标题</label><input value="${esc(s.title)}" data-idx="${i}" data-field="title"></div>
            <div class="form-group"><label>描述</label><textarea data-idx="${i}" data-field="description">${esc(s.description)}</textarea></div>
            <div class="form-group"><label>图片 <span class="size-hint">（推荐 600×400px）</span></label><input type="file" accept="image/*" onchange="uploadGuideImage(this,${i})"><input type="hidden" id="guide_img_${i}" value="${esc(s.image||'')}"><img class="img-preview" id="preview_guide_img_${i}" src="${s.image||''}" style="${s.image?'':'display:none'}"></div>
          </div>`;
      });
      html += `</div><button class="btn btn-primary" style="margin-top:16px;" onclick="saveGuide()">💾 保存</button>`;
      document.getElementById('mainContent').innerHTML = html;
    }

    async function uploadGuideImage(input, idx) {
      if (!input.files[0]) return;
      const url = await uploadImage(input.files[0]);
      document.getElementById('guide_img_' + idx).value = url;
      document.getElementById('preview_guide_img_' + idx).src = url;
      document.getElementById('preview_guide_img_' + idx).style.display = 'block';
      toast('图片上传成功');
    }

    async function saveGuide() {
      const container = document.getElementById('guideList');
      const inputs = container.querySelectorAll('[data-idx]');
      const stepsMap = {};
      inputs.forEach(el => {
        const idx = el.dataset.idx;
        if (!stepsMap[idx]) stepsMap[idx] = {};
        stepsMap[idx][el.dataset.field] = el.value;
        const imgEl = document.getElementById('guide_img_' + idx);
        if (imgEl) stepsMap[idx].image = imgEl.value;
      });
      const steps = Object.values(stepsMap);
      await fetch(ADMIN_API + '/api/admin/guide', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ steps }) });
      toast('保存成功');
    }
```

- [ ] **Step 5: 后台 JavaScript — 景区攻略 Tab**

```javascript
    async function loadAttractionsTab() {
      const data = await fetchJSON('/api/admin/attractions');
      let html = `<h1>🗺️ 景区攻略</h1><div class="dynamic-list" id="attList">`;
      data.items.forEach((a, i) => {
        html += `
          <div class="dynamic-item">
            <div class="form-group"><label>景点名称</label><input value="${esc(a.name)}" data-idx="${i}" data-field="name"></div>
            <div class="form-group"><label>简介</label><textarea data-idx="${i}" data-field="description">${esc(a.description)}</textarea></div>
            <div class="form-group"><label>景点图片 <span class="size-hint">（推荐 600×400px）</span></label><input type="file" accept="image/*" onchange="uploadAttImage(this,${i})"><input type="hidden" id="att_img_${i}" value="${esc(a.image||'')}"><img class="img-preview" id="preview_att_img_${i}" src="${a.image||''}" style="${a.image?'':'display:none'}"></div>
          </div>`;
      });
      html += `</div>`;
      html += `<div class="form-group"><label>景区导览图 <span class="size-hint">（推荐 750×500px）</span></label><input type="file" accept="image/*" onchange="previewAndUpload(this,'f_guideMap')"><input type="hidden" id="f_guideMap" value="${esc(data.guideMapImage||'')}"><img class="img-preview" id="preview_f_guideMap" src="${data.guideMapImage||''}" style="${data.guideMapImage?'':'display:none'}"></div>`;
      html += `<button class="btn btn-primary" onclick="saveAttractions()">💾 保存</button>`;
      document.getElementById('mainContent').innerHTML = html;
    }

    async function uploadAttImage(input, idx) {
      if (!input.files[0]) return;
      const url = await uploadImage(input.files[0]);
      document.getElementById('att_img_' + idx).value = url;
      document.getElementById('preview_att_img_' + idx).src = url;
      document.getElementById('preview_att_img_' + idx).style.display = 'block';
      toast('图片上传成功');
    }

    async function saveAttractions() {
      const container = document.getElementById('attList');
      const inputs = container.querySelectorAll('[data-idx]');
      const itemsMap = {};
      inputs.forEach(el => {
        const idx = el.dataset.idx;
        if (!itemsMap[idx]) itemsMap[idx] = {};
        itemsMap[idx][el.dataset.field] = el.value;
      });
      const items = Object.values(itemsMap);
      const guideMapImage = document.getElementById('f_guideMap').value;
      await fetch(ADMIN_API + '/api/admin/attractions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, guideMapImage }) });
      toast('保存成功');
    }
```

- [ ] **Step 6: 后台 JavaScript — 到达路线 + 周边小吃 + 温馨提示 + 好物 + 留言 Tab**

```javascript
    // 到达路线
    async function loadRoutesTab() {
      const data = await fetchJSON('/api/admin/routes');
      let html = `<h1>📍 到达路线</h1><div class="dynamic-list" id="routeList">`;
      data.items.forEach((r, i) => {
        html += `<div class="dynamic-item">
          <div class="form-group"><label>出发地</label><input value="${esc(r.from)}" data-idx="${i}" data-field="from"></div>
          <div class="form-group"><label>交通方式</label><input value="${esc(r.method)}" data-idx="${i}" data-field="method"></div>
          <div class="form-group"><label>路线说明</label><textarea data-idx="${i}" data-field="description">${esc(r.description)}</textarea></div>
        </div>`;
      });
      html += `</div><button class="btn btn-primary" onclick="saveDynamic('routes','routeList',['from','method','description'],'items')">💾 保存</button>`;
      document.getElementById('mainContent').innerHTML = html;
    }

    // 周边小吃
    async function loadFoodTab() {
      const data = await fetchJSON('/api/admin/food');
      let html = `<h1>🍜 周边小吃</h1><div class="dynamic-list" id="foodList">`;
      data.items.forEach((f, i) => {
        html += `<div class="dynamic-item">
          <div class="form-group"><label>店名</label><input value="${esc(f.name)}" data-idx="${i}" data-field="name"></div>
          <div class="form-group"><label>推荐菜</label><input value="${esc(f.dish)}" data-idx="${i}" data-field="dish"></div>
          <div class="form-group"><label>描述</label><textarea data-idx="${i}" data-field="description">${esc(f.description)}</textarea></div>
          <div style="display:flex;gap:8px;"><div class="form-group" style="flex:1;"><label>纬度</label><input type="number" step="0.0001" value="${f.lat}" data-idx="${i}" data-field="lat"></div><div class="form-group" style="flex:1;"><label>经度</label><input type="number" step="0.0001" value="${f.lng}" data-idx="${i}" data-field="lng"></div></div>
        </div>`;
      });
      html += `</div><button class="btn btn-primary" onclick="saveDynamic('food','foodList',['name','dish','description','lat','lng'],'items')">💾 保存</button>`;
      document.getElementById('mainContent').innerHTML = html;
    }

    // 民宿好物
    async function loadProductsTab() {
      const data = await fetchJSON('/api/admin/products');
      let html = `<h1>🛍️ 民宿好物</h1><div class="dynamic-list" id="prodList">`;
      data.items.forEach((p, i) => {
        html += `<div class="dynamic-item">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><strong>商品 ${i+1}</strong><label style="font-size:13px;"><input type="checkbox" ${p.active?'checked':''} data-idx="${i}" data-field="active"> 上架</label></div>
          <div class="form-group"><label>名称</label><input value="${esc(p.name)}" data-idx="${i}" data-field="name"></div>
          <div class="form-group"><label>价格</label><input type="number" value="${p.price}" data-idx="${i}" data-field="price"></div>
          <div class="form-group"><label>描述</label><textarea data-idx="${i}" data-field="description">${esc(p.description)}</textarea></div>
          <div class="form-group"><label>微信号</label><input value="${esc(p.wechat)}" data-idx="${i}" data-field="wechat"></div>
          <div class="form-group"><label>电话</label><input value="${esc(p.phone)}" data-idx="${i}" data-field="phone"></div>
          <div class="form-group"><label>图片 <span class="size-hint">（推荐 600×600px）</span></label><input type="file" accept="image/*" onchange="uploadProdImage(this,${i})"><input type="hidden" id="prod_img_${i}" value="${esc(p.image||'')}"><img class="img-preview" id="preview_prod_img_${i}" src="${p.image||''}" style="${p.image?'':'display:none'}"></div>
        </div>`;
      });
      html += `</div><button class="btn btn-primary" onclick="saveProducts()">💾 保存</button>`;
      document.getElementById('mainContent').innerHTML = html;
    }

    async function uploadProdImage(input, idx) {
      if (!input.files[0]) return;
      const url = await uploadImage(input.files[0]);
      document.getElementById('prod_img_' + idx).value = url;
      document.getElementById('preview_prod_img_' + idx).src = url;
      document.getElementById('preview_prod_img_' + idx).style.display = 'block';
      toast('图片上传成功');
    }

    async function saveProducts() {
      const container = document.getElementById('prodList');
      const inputs = container.querySelectorAll('[data-idx]');
      const itemsMap = {};
      inputs.forEach(el => {
        const idx = el.dataset.idx;
        if (!itemsMap[idx]) itemsMap[idx] = {};
        if (el.type === 'checkbox') itemsMap[idx][el.dataset.field] = el.checked;
        else itemsMap[idx][el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value;
      });
      // Merge images
      const allImgs = container.querySelectorAll('input[type="hidden"]');
      allImgs.forEach(el => {
        const idx = el.id.replace('prod_img_','');
        if (itemsMap[idx]) itemsMap[idx].image = el.value;
      });
      await fetch(ADMIN_API + '/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: Object.values(itemsMap) }) });
      toast('保存成功');
    }

    // 温馨提示
    async function loadTipsTab() {
      const data = await fetchJSON('/api/admin/tips');
      document.getElementById('mainContent').innerHTML = `
        <h1>💡 温馨提示</h1>
        <div class="form-group"><label>WiFi 名称</label><input id="f_wifi" value="${esc(data.wifi)}"></div>
        <div class="form-group"><label>WiFi 密码</label><input id="f_wifiPassword" value="${esc(data.wifiPassword)}"></div>
        <div class="form-group"><label>退房时间</label><input id="f_checkOutTime" value="${esc(data.checkOutTime)}"></div>
        <div class="form-group"><label>紧急联系电话</label><input id="f_emergencyPhone" value="${esc(data.emergencyPhone)}"></div>
        <div class="form-group"><label>入住须知（每行一条）</label><textarea id="f_notices">${data.notices.join('\n')}</textarea></div>
        <button class="btn btn-primary" onclick="saveTips()">💾 保存</button>
      `;
    }

    async function saveTips() {
      const data = {
        wifi: document.getElementById('f_wifi').value,
        wifiPassword: document.getElementById('f_wifiPassword').value,
        checkOutTime: document.getElementById('f_checkOutTime').value,
        emergencyPhone: document.getElementById('f_emergencyPhone').value,
        notices: document.getElementById('f_notices').value.split('\n').filter(t=>t.trim())
      };
      await fetch(ADMIN_API + '/api/admin/tips', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      toast('保存成功');
    }

    // 留言管理
    async function loadMessagesTab() {
      const data = await fetchJSON('/api/admin/messages');
      let html = `<h1>📝 留言管理 <span style="font-size:14px;color:var(--muted);">（${data.length} 条）</span></h1><div class="messages-list">`;
      data.slice().reverse().forEach(m => {
        const d = new Date(m.createdAt);
        html += `<div class="msg-item"><span class="content">${esc(m.content)}</span><span class="time">${d.toLocaleString('zh-CN')}</span><button class="btn btn-danger" style="padding:4px 12px;font-size:12px;" onclick="deleteMsg('${m.id}')">删除</button></div>`;
      });
      html += `</div>`;
      document.getElementById('mainContent').innerHTML = html;
    }

    async function deleteMsg(id) {
      await fetch(ADMIN_API + '/api/admin/messages/' + id, { method: 'DELETE' });
      toast('留言已删除');
      loadMessagesTab();
    }

    // 通用动态保存
    async function saveDynamic(module, listId, fields, wrapperKey) {
      const container = document.getElementById(listId);
      const inputs = container.querySelectorAll('[data-idx]');
      const itemsMap = {};
      inputs.forEach(el => {
        const idx = el.dataset.idx;
        if (!itemsMap[idx]) itemsMap[idx] = {};
        itemsMap[idx][el.dataset.field] = el.type === 'number' ? Number(el.value) : el.value;
      });
      await fetch(ADMIN_API + '/api/admin/' + module, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [wrapperKey]: Object.values(itemsMap) }) });
      toast('保存成功');
    }
```

- [ ] **Step 7: 后台 JavaScript — Tab 路由与初始化**

```javascript
    const TAB_LOADERS = {
      homestay: loadHomestayTab,
      guide: loadGuideTab,
      attractions: loadAttractionsTab,
      routes: loadRoutesTab,
      food: loadFoodTab,
      products: loadProductsTab,
      tips: loadTipsTab,
      messages: loadMessagesTab
    };

    function loadTab(name) {
      if (TAB_LOADERS[name]) TAB_LOADERS[name]();
    }

    document.addEventListener('DOMContentLoaded', () => loadTab('homestay'));
  </script>
</body>
</html>
```

- [ ] **Step 8: 提交**

```bash
git add admin/index.html
git commit -m "feat: add admin management panel with all 8 module tabs"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动两个服务**

Run: `cd /Users/yu./homestay-service-cards && npm run dev`
Expected: 控制台输出两个服务地址

- [ ] **Step 2: 验证前端 API**

Run: `curl -s http://localhost:3000/api/homestay | head -1`
Expected: JSON 数据

- [ ] **Step 3: 验证前端页面**

Run: `curl -s http://localhost:3000 | grep -c "section-title"`
Expected: 返回大于 0 的数字

- [ ] **Step 4: 验证后台 API**

Run: `curl -s http://localhost:3001/api/admin/homestay | head -1`
Expected: JSON 数据

- [ ] **Step 5: 验证留言功能**

Run: 
```bash
curl -s -X POST http://localhost:3000/api/messages -H "Content-Type: application/json" -d '{"content":"测试留言"}' 
```
Expected: `{"success":true,...}`

- [ ] **Step 6: 验证后台删除留言** (用返回的 id)

Run: `curl -s -X DELETE http://localhost:3001/api/admin/messages/<返回的id>`
Expected: `{"success":true}`

- [ ] **Step 7: 提交（如有文件变更）**

```bash
git add -A
git commit -m "chore: final verification and adjustments"
```

---

### 自审清单

**Spec coverage:**
- [x] 8 个前端 section → Task 5 (Steps 2-9 为 HTML 结构，Steps 10-14 为 JS 渲染)
- [x] 8 个后台 tab → Task 6 (Steps 3-7)
- [x] 一键导航智能适配地图 → Task 5 Step 11
- [x] 购买弹窗（微信复制/电话拨打）→ Task 5 Steps 7, 13
- [x] 留言板跑马灯 → Task 5 Steps 9, 14
- [x] 模块配色交替 → Task 5 Step 1 CSS 中 `section:nth-child(even/odd)`
- [x] 图片上传 → Task 4 Step 1 (multer), Task 6 Steps 3-6 (上传 UI)
- [x] npm run dev 启动 → Task 1 Step 1 (package.json scripts)
- [x] Airbnb × Claude 设计系统 → Task 5 Step 1 (CSS 变量)
- [x] 占位数据 → Task 2 (8 JSON 文件)
- [x] 多店扩展预留 → server.js API 路径为 `/api/` 无硬编码前缀，后续可加中间件

**Placeholder scan:** 无 TBD/TODO/no placeholder issues.

**Type consistency:**
- `data/products.json` 字段: `name, price(number), description, image, active(boolean), wechat, phone`
- 前端 JS 渲染 product 使用 `p.name, p.price, p.description, p.wechat, p.phone` ✓
- 后台 JS 保存 products 使用 `name, price, description, wechat, phone, active, image` ✓
- openBuyModal 签名: `(name, wechat, phone)` → 调用时传 `p.name, p.wechat, p.phone` ✓
- API 端点: `/api/admin/:module` GET/PUT → 后台 JS 调用 `/api/admin/homestay` 等 ✓
- 上传端点: `/api/admin/upload` → 后台 JS 调用 `/api/admin/upload` ✓
