// db.js — SQLite 数据库（店铺 + 用户 + 日志）
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'platform.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'owner',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    property_type TEXT DEFAULT 'homestay',
    owner_user_id INTEGER,
    contact_phone TEXT DEFAULT '',
    contact_wechat TEXT DEFAULT '',
    enabled_modules TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    property_slug TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    store_name TEXT NOT NULL,
    property_type TEXT DEFAULT 'homestay',
    phone TEXT,
    wechat TEXT,
    status TEXT DEFAULT 'pending',
    admin_note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    property_slug TEXT,
    category TEXT DEFAULT 'suggestion',
    title TEXT NOT NULL,
    content TEXT,
    contact TEXT,
    status TEXT DEFAULT 'open',
    admin_reply TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    property_slug TEXT,
    error_type TEXT,
    message TEXT,
    stack TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

const stmts = {
  // Users
  createUser: db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?,?,?)'),
  findByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  findUserById: db.prepare('SELECT id,username,role,created_at,last_login FROM users WHERE id = ?'),
  updateLastLogin: db.prepare(`UPDATE users SET last_login = datetime('now','localtime') WHERE id = ?`),

  // Properties
  allProperties: db.prepare('SELECT * FROM properties ORDER BY created_at DESC'),
  findBySlug: db.prepare('SELECT * FROM properties WHERE slug = ? AND is_active = 1'),
  findPropertyById: db.prepare('SELECT * FROM properties WHERE id = ?'),
  createProperty: db.prepare('INSERT INTO properties (slug, name, property_type, owner_user_id, contact_phone, contact_wechat, enabled_modules) VALUES (?,?,?,?,?,?,?)'),
  deleteProperty: db.prepare('DELETE FROM properties WHERE id = ?'),
  updatePropertyModules: db.prepare('UPDATE properties SET enabled_modules = ? WHERE slug = ?'),
  updatePropertyType: db.prepare('UPDATE properties SET property_type = ? WHERE slug = ?'),
  updatePropertyInfo: db.prepare('UPDATE properties SET name=?, property_type=?, contact_phone=?, contact_wechat=? WHERE slug=?'),
  userProperties: db.prepare('SELECT * FROM properties WHERE owner_user_id = ? AND is_active = 1'),

  // Applications
  createApplication: db.prepare('INSERT INTO applications (name, store_name, property_type, phone, wechat) VALUES (?,?,?,?,?)'),
  allApplications: db.prepare('SELECT * FROM applications ORDER BY created_at DESC'),
  pendingApplications: db.prepare("SELECT * FROM applications WHERE status = 'pending' ORDER BY created_at DESC"),
  updateApplication: db.prepare('UPDATE applications SET status=?, admin_note=? WHERE id=?'),

  // Feedback
  submitFeedback: db.prepare('INSERT INTO feedback (username, property_slug, category, title, content, contact) VALUES (?,?,?,?,?,?)'),
  allFeedback: db.prepare('SELECT * FROM feedback ORDER BY created_at DESC'),
  updateFeedback: db.prepare('UPDATE feedback SET status=?, admin_reply=? WHERE id=?'),

  // Usage logs
  insertLog: db.prepare('INSERT INTO usage_logs (user_id, property_slug, action, details) VALUES (?,?,?,?)'),
  getLogs: db.prepare('SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 200'),
};

// 默认 admin
const bcrypt = require('bcryptjs');
const admin = stmts.findByUsername.get('admin');
if (!admin) {
  stmts.createUser.run('admin', bcrypt.hashSync('admin123', 10), 'admin');
}

// 数据目录
const PROPS_DIR = path.join(__dirname, 'data', 'properties');
if (!fs.existsSync(PROPS_DIR)) fs.mkdirSync(PROPS_DIR, { recursive: true });

const TYPE_MODULES = {
  homestay:  ['homestay','guide','attractions','routes','food','products','tips','messages'],
  hotel:     ['homestay','routes','food','tips','messages','facilities','business'],
  apartment: ['homestay','guide','routes','tips','messages','facilities','nearby'],
};

// 店铺数据读写
function propDir(slug) {
  const dir = path.join(PROPS_DIR, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readPropData(slug, module) {
  const file = path.join(propDir(slug), module + '.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writePropData(slug, module, data) {
  fs.writeFileSync(path.join(propDir(slug), module + '.json'), JSON.stringify(data, null, 2));
}

// 创建店铺时初始化数据文件
function initPropertyData(slug, type, storeName) {
  const mods = TYPE_MODULES[type] || TYPE_MODULES.homestay;
  const dir = propDir(slug);

  const defaults = {
    homestay:    { propertyType: type, name: storeName || slug, logo: '', coverImage: '', description: '', address: '', tags: [], enabledModules: mods },
    guide:       { steps: [{ title: '到达入口', description: '从主路进入，沿指示牌前行。', image: '' }] },
    attractions: { items: [], guideMapImage: '' },
    routes:      { items: [] },
    food:        { items: [] },
    products:    { items: [] },
    tips:        { wifi: '', wifiPassword: '', checkOutTime: '12:00 前退房', emergencyPhone: '', notices: [] },
    facilities:  { items: [] },
    business:    { items: [] },
    nearby:      { items: [] },
    messages:    [],
  };

  for (const mod of mods) {
    if (defaults[mod]) {
      const file = path.join(dir, mod + '.json');
      if (!fs.existsSync(file)) writePropData(slug, mod, defaults[mod]);
    }
  }
  // 也初始化 messages
  const msgFile = path.join(dir, 'messages.json');
  if (!fs.existsSync(msgFile)) writePropData(slug, 'messages', []);
}

module.exports = { db, stmts, propDir, readPropData, writePropData, initPropertyData, TYPE_MODULES };
