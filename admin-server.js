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

app.post('/api/admin/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({ url: '/uploads/' + req.file.filename });
});

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

app.put('/api/admin/:module', (req, res) => {
  const mod = req.params.module;
  if (!VALID_MODULES.includes(mod)) {
    return res.status(404).json({ error: '模块不存在' });
  }
  writeData(mod + '.json', req.body);
  res.json({ success: true });
});

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
