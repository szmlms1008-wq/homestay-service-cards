const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VALID_MODULES = ['homestay', 'guide', 'attractions', 'routes', 'food', 'products', 'tips'];

// ===== Shared helpers =====
function readData(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}

function writeData(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// ===== Image upload =====
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

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ====== Guest API (no auth) ======
app.get('/api/homestay', (_req, res) => res.json(readData('homestay.json')));
app.get('/api/guide', (_req, res) => res.json(readData('guide.json')));
app.get('/api/attractions', (_req, res) => res.json(readData('attractions.json')));
app.get('/api/routes', (_req, res) => res.json(readData('routes.json')));
app.get('/api/food', (_req, res) => res.json(readData('food.json')));

app.get('/api/products', (_req, res) => {
  const data = readData('products.json');
  res.json({ items: data.items.filter(p => p.active) });
});

app.get('/api/tips', (_req, res) => res.json(readData('tips.json')));

app.get('/api/messages', (_req, res) => {
  const data = readData('messages.json');
  res.json(data.slice(-50));
});

app.post('/api/messages', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: '留言内容不能为空' });
  const messages = readData('messages.json');
  const msg = { id: 'm' + Date.now(), content: content.trim(), createdAt: new Date().toISOString() };
  messages.push(msg);
  writeData('messages.json', messages);
  res.json({ success: true, message: msg });
});

// ====== Admin auth middleware ======
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Homestay Admin"');
    return res.status(401).send('需要登录');
  }
  const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASSWORD) return next();
  res.set('WWW-Authenticate', 'Basic realm="Homestay Admin"');
  res.status(401).send('用户名或密码错误');
}

// ====== Admin API (with auth) ======
app.post('/api/admin/upload', basicAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.get('/api/admin/:module', basicAuth, (req, res) => {
  const mod = req.params.module;
  if (mod === 'messages') return res.json(readData('messages.json'));
  if (!VALID_MODULES.includes(mod)) return res.status(404).json({ error: '模块不存在' });
  res.json(readData(mod + '.json'));
});

app.put('/api/admin/:module', basicAuth, (req, res) => {
  const mod = req.params.module;
  if (!VALID_MODULES.includes(mod)) return res.status(404).json({ error: '模块不存在' });
  writeData(mod + '.json', req.body);
  res.json({ success: true });
});

app.delete('/api/admin/messages/:id', basicAuth, (req, res) => {
  const messages = readData('messages.json');
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '留言不存在' });
  messages.splice(idx, 1);
  writeData('messages.json', messages);
  res.json({ success: true });
});

// ====== Admin static pages (with auth) ======
app.get('/admin', basicAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.use('/admin', basicAuth, express.static(path.join(__dirname, 'admin')));

// ====== Guest static pages (no auth) ======
app.use(express.static(path.join(__dirname, 'public')));

// ====== Start ======
app.listen(PORT, () => {
  const isDefault = ADMIN_PASSWORD === 'admin123';
  console.log(`🏡 民宿服务卡片: http://localhost:${PORT}`);
  console.log(`⚙️  后台管理:     http://localhost:${PORT}/admin`);
  console.log(`   账号: admin  密码: ${ADMIN_PASSWORD}${isDefault ? ' (默认)' : ''}`);
});
