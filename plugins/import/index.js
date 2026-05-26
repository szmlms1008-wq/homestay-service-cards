// plugins/import/index.js — 数据导入插件
const express = require('express');
const multer = require('multer');
const path = require('path');
const { readPropDataAsync, writePropDataAsync, withLock } = require('../../db');
const { MODULES } = require('./schemas');
const { mapTextToModule, parseUrl, parseFile } = require('./parsers');
const { generateWithAI } = require('./ai-adapter');

const VALID_MODULES = Object.keys(MODULES);

// 文件上传（内存存储，处理后立即释放）
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.json', '.txt'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

function mount(app, { authRequired, propertyOwner, logAction }) {

  // ====== POST /parse — 解析输入（预览，不写入） ======
  app.post('/api/p/:slug/admin/import/parse', authRequired, propertyOwner, fileUpload.single('file'), async (req, res) => {
    const { method, targetModule, url, text, prompt, count } = req.body;
    const moduleName = targetModule || req.body.targetModule;

    if (!moduleName || !VALID_MODULES.includes(moduleName)) {
      return res.status(400).json({ error: `不支持的模块类型: ${moduleName}，支持: ${VALID_MODULES.join(', ')}` });
    }

    try {
      let result;

      if (req.file) {
        // 文件上传模式
        result = await parseFile(req.file.buffer, req.file.originalname, moduleName);
      } else if (method === 'url' && url) {
        result = await parseUrl(url, moduleName);
      } else if (method === 'ai' || (method === undefined && prompt)) {
        result = await generateWithAI(moduleName, prompt || '', count || 5);
      } else if (method === 'text' || (method === undefined && text)) {
        result = mapTextToModule(text || '', moduleName);
      } else if (!method && !text && !url && !prompt) {
        return res.status(400).json({ error: '请提供 method + 对应数据（text/url/file/prompt）' });
      } else {
        return res.status(400).json({ error: `不支持的导入方式: ${method}` });
      }

      if (result.error) {
        return res.status(result.data === null ? 422 : 200).json(result);
      }

      logAction(req.user.id, req.params.slug, 'import_parse', { method: method || 'file', module: moduleName });
      res.json({
        suggestedModule: moduleName,
        ...result,
      });
    } catch (e) {
      console.error('Import parse error:', e);
      res.status(500).json({ error: '解析失败: ' + e.message });
    }
  });

  // ====== POST /save — 确认写入数据 ======
  app.post('/api/p/:slug/admin/import/save', authRequired, propertyOwner, async (req, res) => {
    const { targetModule, data, mode } = req.body;
    const { slug } = req.params;

    if (!targetModule || !VALID_MODULES.includes(targetModule)) {
      return res.status(400).json({ error: `不支持的模块类型: ${targetModule}` });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '请提供有效的 data' });
    }

    try {
      const schema = MODULES[targetModule];
      const saveMode = mode || 'replace';

      if (saveMode === 'merge' && schema.wrapperKey) {
        let added = 0;
        await withLock('prop-' + slug + '-' + targetModule, async () => {
          const existing = await readPropDataAsync(slug, targetModule) || { [schema.wrapperKey]: [] };
          const existingItems = existing[schema.wrapperKey] || [];
          const newItems = data[schema.wrapperKey] || [];
          const existingNames = new Set(existingItems.map(item => item.name?.trim()));
          for (const item of newItems) {
            if (item.name && !existingNames.has(item.name.trim())) {
              existingItems.push(item);
              existingNames.add(item.name.trim());
              added++;
            }
          }
          if (schema.hasTopLevel && data.guideMapImage) {
            existing.guideMapImage = data.guideMapImage;
          }
          await writePropDataAsync(slug, targetModule, existing);
        });
        logAction(req.user.id, slug, 'import_save_merge', { module: targetModule, added });
        return res.json({ success: true, written: added, module: targetModule, mode: 'merge' });
      }

      // 替换模式（无需锁，全量覆盖）
      await writePropDataAsync(slug, targetModule, data);
      const itemCount = schema.wrapperKey ? (data[schema.wrapperKey] || []).length : Object.keys(data).length;
      logAction(req.user.id, slug, 'import_save_replace', { module: targetModule, written: itemCount });
      res.json({ success: true, written: itemCount, module: targetModule, mode: 'replace' });
    } catch (e) {
      console.error('Import save error:', e);
      res.status(500).json({ error: '保存失败: ' + e.message });
    }
  });

  // ====== POST /ai — AI 生成（便捷入口，= /parse with method=ai） ======
  app.post('/api/p/:slug/admin/import/ai', authRequired, propertyOwner, async (req, res) => {
    const { targetModule, prompt, count } = req.body;

    if (!targetModule || !VALID_MODULES.includes(targetModule)) {
      return res.status(400).json({ error: `不支持的模块类型: ${targetModule}` });
    }
    if (!prompt) {
      return res.status(400).json({ error: '请输入提示词，例如：都江堰附近的景点推荐' });
    }

    try {
      const result = await generateWithAI(targetModule, prompt, count || 5);
      if (result.error) {
        const status = result.error.includes('未配置') ? 501 : 503;
        return res.status(status).json(result);
      }

      logAction(req.user.id, req.params.slug, 'import_ai', { module: targetModule, prompt });
      res.json({ suggestedModule: targetModule, ...result });
    } catch (e) {
      console.error('Import AI error:', e);
      res.status(500).json({ error: 'AI 生成失败: ' + e.message });
    }
  });

  console.log('  📥 数据导入插件已挂载: /api/p/:slug/admin/import/[parse|save|ai]');
}

module.exports = { mount, VALID_MODULES };
