// app.js — 多店铺服务卡片 + 竞品雷达平台
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { db, stmts, propDir, readPropData, writePropData, initPropertyData, TYPE_MODULES } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'service-cards-secret-key';
const FEATURE_RADAR = process.env.FEATURE_RADAR === 'true';

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== JWT 中间件 ======
function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: '请先登录' });
  try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: '登录过期' }); }
}

function adminRequired(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  next();
}

function propertyOwner(req, res, next) {
  const prop = stmts.findBySlug.get(req.params.slug);
  if (!prop) return res.status(404).json({ error: '店铺不存在' });
  if (req.user.role === 'admin' || prop.owner_user_id === req.user.id) {
    req.property = prop;
    return next();
  }
  return res.status(403).json({ error: '无此店铺权限' });
}

function logAction(userId, propSlug, action, details) {
  try { stmts.insertLog.run(userId, propSlug, action, details ? JSON.stringify(details) : null); } catch (e) {}
}

// Multer
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_r, file, cb) => cb(null, ['.jpg','.jpeg','.png','.webp'].includes(path.extname(file.originalname).toLowerCase())) });

// ====== Auth API ======
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = stmts.findByUsername.get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: '用户名或密码错误' });
  stmts.updateLastLogin.run(user.id);
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  logAction(user.id, null, 'login', null);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// 老板申请入驻（无需登录）
app.post('/api/apply', (req, res) => {
  const { name, store_name, property_type, phone, wechat } = req.body;
  if (!name || !store_name) return res.status(400).json({ error: '姓名和店名必填' });
  stmts.createApplication.run(name, store_name, property_type || 'homestay', phone || '', wechat || '');
  res.json({ success: true, message: '申请已提交，我们审核后会联系您' });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length < 2 || password.length < 4) return res.status(400).json({ error: '用户名≥2位，密码≥4位' });
  if (stmts.findByUsername.get(username)) return res.status(409).json({ error: '用户名已存在' });
  const r = stmts.createUser.run(username, bcrypt.hashSync(password, 10), 'owner');
  const token = jwt.sign({ id: r.lastInsertRowid, username, role: 'owner' }, JWT_SECRET, { expiresIn: '7d' });
  logAction(r.lastInsertRowid, null, 'register', { username });
  res.json({ token, user: { id: r.lastInsertRowid, username, role: 'owner' } });
});

// ====== 总后台 API ======
app.get('/api/admin/properties', authRequired, adminRequired, (_req, res) => {
  res.json(stmts.allProperties.all());
});

app.post('/api/admin/properties', authRequired, adminRequired, (req, res) => {
  const { slug, name, property_type, owner_user_id, contact_phone, contact_wechat } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'slug 和 name 必填' });
  if (stmts.findBySlug.get(slug)) return res.status(409).json({ error: 'slug 已存在' });
  const mods = JSON.stringify(TYPE_MODULES[property_type] || TYPE_MODULES.homestay);
  stmts.createProperty.run(slug, name, property_type || 'homestay', owner_user_id || null, contact_phone || '', contact_wechat || '', mods);
  initPropertyData(slug, property_type || 'homestay', name);
  logAction(req.user.id, slug, 'create_property', { name, type: property_type });
  res.json({ success: true, slug });
});

app.delete('/api/admin/properties/:id', authRequired, adminRequired, (req, res) => {
  stmts.deleteProperty.run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/users', authRequired, adminRequired, (_req, res) => {
  res.json(db.prepare('SELECT id,username,role,created_at,last_login FROM users ORDER BY created_at DESC').all());
});

app.get('/api/admin/logs', authRequired, adminRequired, (_req, res) => {
  res.json(stmts.getLogs.all());
});

app.get('/api/admin/applications', authRequired, adminRequired, (_req, res) => {
  res.json(stmts.allApplications.all());
});

// 审核通过 → 自动创建店铺 + 分配账号
app.put('/api/admin/applications/:id', authRequired, adminRequired, (req, res) => {
  const { status, admin_note } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: '申请不存在' });

  stmts.updateApplication.run(status || 'approved', admin_note || '', req.params.id);

  if (status === 'approved') {
    // 生成 slug
    const slug = app.store_name.replace(/[^一-龥a-zA-Z0-9]/g, '').toLowerCase().substring(0, 20) || 'store' + Date.now();
    // 生成随机账号
    const username = 'store_' + Date.now().toString(36);
    const password = Math.random().toString(36).slice(-8);
    const hash = bcrypt.hashSync(password, 10);

    try {
      // 创建用户
      const ownerId = stmts.createUser.run(username, hash, 'owner').lastInsertRowid;
      // 创建店铺
      if (!stmts.findBySlug.get(slug)) {
        const mods = JSON.stringify(TYPE_MODULES[app.property_type] || TYPE_MODULES.homestay);
        stmts.createProperty.run(slug, app.store_name, app.property_type, ownerId, app.phone || '', app.wechat || '', mods);
        initPropertyData(slug, app.property_type, app.store_name);
      }
      stmts.updateApplication.run('approved', '账号: ' + username + ' / 密码: ' + password, req.params.id);
      logAction(req.user.id, slug, 'approve_application', { applicant: app.name, store: app.store_name });
      res.json({ success: true, username, password, slug, store_name: app.store_name });
    } catch (e) {
      stmts.updateApplication.run('error', e.message, req.params.id);
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ success: true });
  }
});

// ====== 店铺数据 API（客人端，无需认证） ======
app.get('/api/p/:slug/modules', (req, res) => {
  const prop = stmts.findBySlug.get(req.params.slug);
  if (!prop) return res.status(404).json({ error: '店铺不存在' });
  let mods = [];
  try { mods = JSON.parse(prop.enabled_modules || '[]'); } catch (e) { mods = TYPE_MODULES.homestay; }
  res.json({ propertyType: prop.property_type, modules: mods, name: prop.name });
});

app.get('/api/p/:slug/:module', (req, res) => {
  const { slug, module } = req.params;
  const prop = stmts.findBySlug.get(slug);
  if (!prop) return res.status(404).json({ error: '店铺不存在' });

  if (module === 'messages') {
    const data = readPropData(slug, 'messages') || [];
    return res.json(Array.isArray(data) ? data.slice(-50) : []);
  }
  if (module === 'homestay' || module === 'products') {
    const data = readPropData(slug, module) || {};
    if (module === 'products') return res.json({ items: (data.items || []).filter(p => p.active !== false) });
    return res.json(data);
  }
  res.json(readPropData(slug, module) || {});
});

app.post('/api/p/:slug/messages', (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: '内容不能为空' });
  const msgs = readPropData(slug, 'messages') || [];
  msgs.push({ id: 'm' + Date.now(), content: content.trim(), createdAt: new Date().toISOString() });
  writePropData(slug, 'messages', msgs);
  res.json({ success: true });
});

// ====== 店铺后台 API（需 JWT + owner） ======
app.post('/api/p/:slug/admin/upload', authRequired, propertyOwner, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.get('/api/p/:slug/admin/:module', authRequired, propertyOwner, (req, res) => {
  const { slug, module } = req.params;
  if (module === 'messages') return res.json(readPropData(slug, 'messages') || []);
  res.json(readPropData(slug, module) || {});
});

app.put('/api/p/:slug/admin/:module', authRequired, propertyOwner, (req, res) => {
  const { slug, module } = req.params;
  if (module === 'modules') {
    const { enabledModules, propertyType } = req.body;
    if (enabledModules) stmts.updatePropertyModules.run(JSON.stringify(enabledModules), slug);
    if (propertyType) {
      stmts.updatePropertyType.run(propertyType, slug);
      const info = readPropData(slug, 'homestay') || {};
      info.propertyType = propertyType;
      writePropData(slug, 'homestay', info);
    }
    logAction(req.user.id, slug, 'update_modules', { modules: enabledModules, type: propertyType });
    return res.json({ success: true });
  }
  writePropData(slug, module, req.body);
  logAction(req.user.id, slug, 'update_' + module, null);
  res.json({ success: true });
});

app.delete('/api/p/:slug/admin/messages/:id', authRequired, propertyOwner, (req, res) => {
  const msgs = readPropData(req.params.slug, 'messages') || [];
  const idx = msgs.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '不存在' });
  msgs.splice(idx, 1);
  writePropData(req.params.slug, 'messages', msgs);
  res.json({ success: true });
});

// ====== 静态页面 ======
// 总后台
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 店铺后台
app.get('/p/:slug/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin', 'property-admin.html')));

// 店铺客人端
app.get('/p/:slug', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'property.html')));

// 申请页面
app.get('/apply', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'apply.html')));

// 平台首页
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🏡 服务卡片平台: http://localhost:${PORT}`);
  console.log(`   总后台 /admin      | admin/admin123`);
  console.log(`   店铺页 /p/店铺名   | 后台 /p/店铺名/admin`);
  if (FEATURE_RADAR) console.log(`   🔮 竞品雷达 已启用`);
  console.log(`   管理API /api/admin | 创建店铺 API 就绪`);
});
