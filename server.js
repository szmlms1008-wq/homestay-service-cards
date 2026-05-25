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

app.get('/api/homestay', (_req, res) => {
  res.json(readData('homestay.json'));
});

app.get('/api/guide', (_req, res) => {
  res.json(readData('guide.json'));
});

app.get('/api/attractions', (_req, res) => {
  res.json(readData('attractions.json'));
});

app.get('/api/routes', (_req, res) => {
  res.json(readData('routes.json'));
});

app.get('/api/food', (_req, res) => {
  res.json(readData('food.json'));
});

app.get('/api/products', (_req, res) => {
  const data = readData('products.json');
  res.json({ items: data.items.filter(p => p.active) });
});

app.get('/api/tips', (_req, res) => {
  res.json(readData('tips.json'));
});

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
