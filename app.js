// app.js — 多店铺服务卡片 + 竞品雷达平台
require('express-async-errors');
const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { db, stmts, propDir, readPropData, writePropData, readPropDataAsync, writePropDataAsync, initPropertyData, TYPE_MODULES, withLock } = require('./db');

const UPLOADS_DIR = process.env.UPLOADS_DIR || UPLOADS_DIR;
const rateLimit = require('express-rate-limit');
const { execSync } = require('child_process');
const importPlugin = require('./plugins/import');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: '请求过于频繁，请15分钟后再试' } });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (() => {
  const key = process.env.JWT_SECRET;
  if (key) return key;
  const crypto = require('crypto');
  const generated = crypto.randomBytes(32).toString('hex');
  console.warn('[警告] 未设置 JWT_SECRET 环境变量，已随机生成临时密钥');
  console.warn('[提示] 生产环境请务必设置 JWT_SECRET，否则重启后所有用户需重新登录');
  return generated;
})();
const FEATURE_RADAR = process.env.FEATURE_RADAR === 'true';

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// 错误日志：拦截所有 4xx/5xx JSON 响应
app.use((req, res, next) => {
  const orig = res.json.bind(res);
  res.json = function(body) {
    if (res.statusCode >= 400 && body && body.error) {
      try {
        stmts.logError.run(req.user?.id || null, req.params?.slug || null, 'http_' + res.statusCode, body.error, req.originalUrl);
      } catch(e) {}
    }
    return orig(body);
  };
  next();
});

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
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const ALLOWED_EXT = ['.jpg','.jpeg','.png','.webp','.gif','.bmp','.svg','.heic','.heif','.avif'];
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) return cb(null, true);
    cb(new Error('不支持的图片格式: ' + ext + '（支持: ' + ALLOWED_EXT.join(',') + '）'));
  }
});

// ====== Auth API ======
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  const user = stmts.findByUsername.get(username);
  if (!user || !await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: '用户名或密码错误' });
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

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length < 2 || password.length < 4) return res.status(400).json({ error: '用户名≥2位，密码≥4位' });
  if (stmts.findByUsername.get(username)) return res.status(409).json({ error: '用户名已存在' });
  const r = stmts.createUser.run(username, await bcrypt.hash(password, 10), 'owner');
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
  const prop = stmts.findPropertyById.get(req.params.id);
  if (prop) {
    stmts.deleteProperty.run(req.params.id);
    // 清理数据目录
    const propDataDir = path.join(propDir(prop.slug));
    try {
      if (fs.existsSync(propDataDir)) {
        fs.rmSync(propDataDir, { recursive: true, force: true });
      }
    } catch (e) { console.error('清理数据目录失败:', e.message); }
  }
  res.json({ success: true });
});

app.get('/api/admin/users', authRequired, adminRequired, (_req, res) => {
  res.json(db.prepare('SELECT id,username,role,created_at,last_login FROM users ORDER BY created_at DESC').all());
});

app.get('/api/admin/logs', authRequired, adminRequired, (_req, res) => {
  res.json(stmts.getLogs.all());
});

// 反馈系统
app.post('/api/feedback', authRequired, (req, res) => {
  const { category, title, content, contact } = req.body;
  if (!title) return res.status(400).json({ error: '标题必填' });
  stmts.submitFeedback.run(req.user.username, req.body.property_slug || '', category || 'suggestion', title, content || '', contact || '');
  logAction(req.user.id, req.body.property_slug || '', 'submit_feedback', { title });
  res.json({ success: true });
});

app.get('/api/admin/feedback', authRequired, adminRequired, (_req, res) => {
  res.json(stmts.allFeedback.all());
});

app.put('/api/admin/feedback/:id', authRequired, adminRequired, (req, res) => {
  const { status, admin_reply } = req.body;
  stmts.updateFeedback.run(status || 'closed', admin_reply || '', req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/applications', authRequired, adminRequired, (_req, res) => {
  res.json(stmts.allApplications.all());
});

// 审核通过 → 自动创建店铺 + 分配账号
app.put('/api/admin/applications/:id', authRequired, adminRequired, async (req, res) => {
  const { status, admin_note } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: '申请不存在' });
  // 防止重复审批
  if (app.status === 'approved' && status === 'approved') {
    return res.json({ success: false, error: '该申请已通过审批' });
  }

  stmts.updateApplication.run(status || 'approved', admin_note || '', req.params.id);

  if (status === 'approved') {
    const slug = app.store_name.replace(/[^一-龥a-zA-Z0-9]/g, '').toLowerCase().substring(0, 20) || 'store' + Date.now();
    const username = 'store_' + Date.now().toString(36);
    const password = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(password, 10);

    try {
      const ownerId = stmts.createUser.run(username, hash, 'owner').lastInsertRowid;
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

// 获取当前用户的店铺列表
app.get('/api/me/properties', authRequired, (req, res) => {
  if (req.user.role === 'admin') return res.json(stmts.allProperties.all());
  res.json(stmts.userProperties.all(req.user.id));
});

// 修改密码
app.put('/api/me/password', authRequired, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: '新密码至少4位' });
  }
  const user = stmts.findByUsername.get(req.user.username);
  if (!user || !await bcrypt.compare(oldPassword, user.password_hash)) {
    return res.status(400).json({ error: '原密码错误' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(newPassword, 10), req.user.id);
  logAction(req.user.id, null, 'change_password', null);
  res.json({ success: true });
});

// ====== 店铺数据 API（客人端，无需认证） ======
app.get('/api/p/:slug/modules', (req, res) => {
  const prop = stmts.findBySlug.get(req.params.slug);
  if (!prop) return res.status(404).json({ error: '店铺不存在' });
  let mods = [];
  try { mods = JSON.parse(prop.enabled_modules || '[]'); } catch (e) { mods = TYPE_MODULES.homestay; }
  res.json({ propertyType: prop.property_type, modules: mods, name: prop.name });
});

app.get('/api/p/:slug/:module', async (req, res) => {
  const { slug, module } = req.params;
  const prop = stmts.findBySlug.get(slug);
  if (!prop) return res.status(404).json({ error: '店铺不存在' });

  if (module === 'messages') {
    const data = await readPropDataAsync(slug, 'messages') || [];
    return res.json(Array.isArray(data) ? data.slice(-50) : []);
  }
  if (module === 'homestay' || module === 'products') {
    const data = await readPropDataAsync(slug, module) || {};
    if (module === 'products') return res.json({ items: (data.items || []).filter(p => p.active !== false) });
    return res.json(data);
  }
  res.json(await readPropDataAsync(slug, module) || {});
});

app.post('/api/p/:slug/messages', rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: '留言过于频繁，请1分钟后再试' } }), async (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: '内容不能为空' });
  await withLock('msg-' + slug, async () => {
    const msgs = await readPropDataAsync(slug, 'messages') || [];
    msgs.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), content: content.trim(), createdAt: new Date().toISOString() });
    await writePropDataAsync(slug, 'messages', msgs);
  });
  res.json({ success: true });
});

// ====== 店铺后台 API（需 JWT + owner） ======
app.post('/api/p/:slug/admin/upload', authRequired, propertyOwner, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? '文件过大，请压缩到 20MB 以内' : (err.message || '上传失败');
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

app.get('/api/p/:slug/admin/:module', authRequired, propertyOwner, async (req, res) => {
  const { slug, module } = req.params;
  if (module === 'messages') return res.json(await readPropDataAsync(slug, 'messages') || []);
  res.json(await readPropDataAsync(slug, module) || {});
});

app.put('/api/p/:slug/admin/:module', authRequired, propertyOwner, async (req, res) => {
  const { slug, module } = req.params;
  if (module === 'modules') {
    const { enabledModules, propertyType } = req.body;
    if (enabledModules) stmts.updatePropertyModules.run(JSON.stringify(enabledModules), slug);
    if (propertyType) {
      stmts.updatePropertyType.run(propertyType, slug);
      const info = await readPropDataAsync(slug, 'homestay') || {};
      info.propertyType = propertyType;
      await writePropDataAsync(slug, 'homestay', info);
    }
    logAction(req.user.id, slug, 'update_modules', { modules: enabledModules, type: propertyType });
    return res.json({ success: true });
  }
  await writePropDataAsync(slug, module, req.body);
  logAction(req.user.id, slug, 'update_' + module, null);
  res.json({ success: true });
});

app.delete('/api/p/:slug/admin/messages/:id', authRequired, propertyOwner, async (req, res) => {
  const { slug } = req.params;
  let found = false;
  await withLock('msg-' + slug, async () => {
    const msgs = await readPropDataAsync(slug, 'messages') || [];
    const idx = msgs.findIndex(m => m.id === req.params.id);
    if (idx === -1) return;
    msgs.splice(idx, 1);
    await writePropDataAsync(slug, 'messages', msgs);
    found = true;
  });
  if (!found) return res.status(404).json({ error: '不存在' });
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

// 宣传页（首页）
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));

// 平台首页
app.use(express.static(path.join(__dirname, 'public')));

// ====== 仪表盘统计 ======
const serverStartTime = new Date();
app.get('/api/admin/stats', authRequired, adminRequired, (_req, res) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const todayLogs = stmts.getLogs.all().filter(l => l.created_at?.startsWith(today));
  const visits = todayLogs.filter(l => l.action === 'login').length;
  const loginFails = db.prepare("SELECT COUNT(*) as c FROM error_logs WHERE error_type = 'http_401' AND created_at LIKE ?").get(today + '%').c;
  const errors = db.prepare("SELECT COUNT(*) as c FROM error_logs WHERE error_type != 'http_401' AND created_at LIKE ?").get(today + '%').c;
  const props = stmts.allProperties.all().length;
  const apps = stmts.pendingApplications.all().length;
  const uptime = Math.floor((now - serverStartTime) / 1000 / 60); // minutes
  res.json({ date: today, visits, loginFails, errors, properties: props, pendingApps: apps, uptime, status: 'ok' });
});

// ====== 异常告警（可选，通过 Server酱 发微信通知） ======
const ALERT_SCKEY = process.env.ALERT_SCKEY; // Server酱 SendKey，不设就不启用
let lastAlertTime = 0;
let lastLoginFailCount = 0;
setInterval(async () => {
  if (!ALERT_SCKEY) return;
  try {
    const now = new Date();
    const recent = db.prepare("SELECT COUNT(*) as c FROM error_logs WHERE created_at > datetime('now','-10 minutes')").get().c;
    const fails = db.prepare("SELECT COUNT(*) as c FROM error_logs WHERE error_type = 'http_401' AND created_at > datetime('now','-10 minutes')").get().c;
    if (fails > 20 && fails > lastLoginFailCount * 2 && now - lastAlertTime > 30 * 60 * 1000) {
      lastAlertTime = now;
      lastLoginFailCount = fails;
      await fetch('https://sctapi.ftqq.com/' + ALERT_SCKEY + '.send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '宿说安全告警', desp: '10分钟内登录失败 ' + fails + ' 次，可能有人在暴力破解！\n总错误: ' + recent + ' 条' })
      });
      console.log('[告警] 已发送微信通知');
    }
  } catch(e) {}
}, 5 * 60 * 1000);

// ====== 自动备份 ======
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 3 && now.getMinutes() < 5) { // 凌晨3点
    const backupDir = path.join(__dirname, 'data', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    try {
      fs.copyFileSync(path.join(__dirname, 'data', 'platform.db'), path.join(backupDir, 'platform-' + dateStr + '.db'));
      console.log('[备份] 数据已备份到 data/backups/platform-' + dateStr + '.db');
      // 只保留最近7天的备份
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db')).sort();
      while (files.length > 7) {
        fs.unlinkSync(path.join(backupDir, files[0]));
        files.shift();
      }
    } catch(e) { console.error('[备份] 失败:', e.message); }
  }
}, 5 * 60 * 1000); // 每5分钟检查一次

// 数据导入插件
importPlugin.mount(app, { authRequired, propertyOwner, logAction });

// 数据导出（一键迁移）
app.get('/api/admin/export', authRequired, adminRequired, (req, res) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const tmpZip = path.join(require('os').tmpdir(), 'sushuo-export-' + dateStr + '.zip');
  try {
    // 用系统 zip 打包
    const dataDir = path.join(__dirname, 'data');
    const uploadsDir = UPLOADS_DIR;
    const files = [];
    if (fs.existsSync(path.join(dataDir, 'platform.db'))) files.push('data/platform.db');
    if (fs.existsSync(path.join(dataDir, 'properties'))) files.push('data/properties');
    if (fs.existsSync(path.join(dataDir, '.admin-recovery'))) files.push('data/.admin-recovery');
    if (fs.existsSync(uploadsDir)) files.push('uploads');
    if (files.length === 0) return res.status(400).json({ error: '没有数据可导出' });
    execSync('zip -r "' + tmpZip + '" ' + files.join(' ') + ' -x "uploads/.gitkeep" "data/properties/.gitkeep"', { cwd: __dirname, stdio: 'pipe' });
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=sushuo-' + dateStr + '.zip');
    res.sendFile(tmpZip, () => { try { fs.unlinkSync(tmpZip); } catch(e) {} });
    logAction(req.user.id, null, 'export_data', { date: dateStr });
  } catch(e) {
    console.error('[导出] 失败:', e.message);
    try { fs.unlinkSync(tmpZip); } catch(_) {}
    res.status(500).json({ error: '导出失败: ' + e.message });
  }
});

// 查看错误日志
app.get('/api/admin/error-logs', authRequired, adminRequired, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  res.json(db.prepare('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?').all(limit));
});

// 集中错误处理
app.use((err, _req, res, _next) => {
  console.error('[服务器错误]', err.stack || err.message || err);
  try {
    stmts.logError.run(null, null, 'uncaught', err.message, err.stack?.slice(0, 500));
  } catch(e) {}
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🏡 宿说 - 让住所替你说: http://localhost:${PORT}`);
  console.log(`   总后台 /admin`);
  console.log(`   店铺页 /p/店铺名   | 后台 /p/店铺名/admin`);
  if (FEATURE_RADAR) console.log(`   🔮 竞品雷达 已启用`);
  console.log(`   管理API /api/admin | 创建店铺 API 就绪`);
});
