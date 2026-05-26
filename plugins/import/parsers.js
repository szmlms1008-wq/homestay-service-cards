// parsers.js — 文本/URL/文件解析器
const { buildAliasMap, getDefaultData, MODULES } = require('./schemas');

// ========== 文本解析 ==========

function mapTextToModule(text, moduleName) {
  const schema = MODULES[moduleName];
  if (!schema) return { data: null, confidence: 0 };

  const aliasMap = buildAliasMap(moduleName);
  const isFlat = !schema.wrapperKey;

  if (isFlat) {
    return parseFlatText(text, schema, aliasMap);
  }
  return parseListText(text, schema, aliasMap);
}

function parseListText(text, schema, aliasMap) {
  // 分割为独立条目：先按空行，再尝试编号模式
  const chunks = splitIntoChunks(text);
  const items = [];
  const requiredFields = Object.entries(schema.shape)
    .filter(([, def]) => def.required)
    .map(([field]) => field);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const item = {};

    // 尝试识别字段模式：字段名：值 或 字段名：值
    const fieldPattern = /^(.+?)[：:]\s*(.+)$/gm;
    let match;
    const linesWithoutField = [];

    while ((match = fieldPattern.exec(chunk)) !== null) {
      const rawKey = match[1].trim();
      const value = match[2].trim();
      const mappedField = aliasMap[rawKey.toLowerCase()];
      if (mappedField) {
        item[mappedField] = convertValue(value, schema.shape[mappedField].type);
      } else {
        linesWithoutField.push(`${rawKey}：${value}`);
      }
    }

    // 无分隔符的纯文本行 → 第一行作为 name，其余作为 description
    const plainLines = chunk.split('\n').filter(l => { const t = l.trim(); return t && !/[：:]/.test(t); });
    if (!item.name && plainLines.length > 0) {
      const firstLine = plainLines[0].trim();
      const dashSep = findSeparator(firstLine);
      // 如果是 "名称 - 描述" 或 "名称 — 描述" 格式
      if (dashSep > 0 && (firstLine.indexOf(' - ', dashSep - 1) >= 0 || firstLine.indexOf(' — ', dashSep - 1) >= 0)) {
        item.name = firstLine.substring(0, dashSep).trim();
        const val = firstLine.substring(dashSep + 1).trim();
        if (val && val !== '-') {
          item.description = val;
        }
      } else {
        item.name = firstLine;
      }
      if (!item.description && plainLines.length > 1) {
        item.description = plainLines.slice(1).join('\n').trim();
      }
    }

    // 如果没有识别出字段，按行结构化
    if (Object.keys(item).length === 0) {
      const lines = chunk.split('\n').filter(l => l.trim());
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (i === 0) {
          // 第一行通常是名称
          const cleaned = line.replace(/^[\d]+[.)、]\s*/, '');
          // 尝试用分隔符拆分：先看是否是已知字段名，否则视为 name: description
          const sepIdx = findSeparator(line);
          if (sepIdx > 0) {
            const key = line.substring(0, sepIdx).trim();
            const val = line.substring(sepIdx + 1).trim();
            const possibleField = aliasMap[key.toLowerCase()];
            if (possibleField) {
              item[possibleField] = convertValue(val, schema.shape[possibleField].type);
              continue;
            }
            // 非字段名但有分隔符 → 视为 name + description
            item.name = key;
            if (!item.description && val) item.description = val;
            continue;
          }
          item.name = cleaned;
        } else {
          // 后续行：尝试识别 key:value 或作为描述补充
          const sep = findSeparator(line);
          if (sep > 0) {
            const key = line.substring(0, sep).trim();
            const val = line.substring(sep + 1).trim();
            const mapped = aliasMap[key.toLowerCase()];
            if (mapped) {
              item[mapped] = convertValue(val, schema.shape[mapped].type);
              continue;
            }
          }
          // 默认为描述
          if (!item.description) {
            item.description = line;
          } else {
            item.description += '\n' + line;
          }
        }
      }
    } else if (linesWithoutField.length > 0) {
      // 处理未识别行
      const remaining = linesWithoutField.join('\n');
      if (!item.description && !item.name) {
        // 尝试提取名称
        const firstLine = linesWithoutField[0];
        const sep = findSeparator(firstLine);
        if (sep > 0) {
          item.name = firstLine.substring(0, sep).trim();
          if (!item.description) item.description = firstLine.substring(sep + 1).trim();
        } else {
          item.name = firstLine;
        }
      } else if (!item.description) {
        item.description = remaining;
      }
    }

    // 跳过空条目
    if (!item.name && !item.title) continue;

    // 确保 name 字段存在（title → name 映射）
    if (!item.name && item.title) {
      item.name = item.title;
      delete item.title;
    }

    items.push(item);
  }

  const confidence = items.length > 0 ? Math.min(0.95, 0.3 + items.length * 0.1) : 0;
  return {
    data: { [schema.wrapperKey]: items, ...(schema.hasTopLevel || {}) },
    confidence,
    stats: { total: items.length },
  };
}

function parseFlatText(text, schema, aliasMap) {
  const result = {};

  const fieldPattern = /^(.+?)[：:]\s*(.+)$/gm;
  let match;
  const unmatchedLines = [];

  while ((match = fieldPattern.exec(text)) !== null) {
    const rawKey = match[1].trim();
    const value = match[2].trim();
    const mappedField = aliasMap[rawKey.toLowerCase()];
    if (mappedField) {
      if (schema.shape[mappedField].type === 'array') {
        if (!result[mappedField]) result[mappedField] = [];
        result[mappedField].push(value);
      } else {
        result[mappedField] = value;
      }
    } else {
      unmatchedLines.push(`${rawKey}：${value}`);
    }
  }

  // 未匹配的行尝试作为 notices
  const noticeField = Object.keys(schema.shape).find(f => schema.shape[f].type === 'array');
  if (noticeField && unmatchedLines.length > 0) {
    if (!result[noticeField]) result[noticeField] = [];
    result[noticeField].push(...unmatchedLines.map(l => l.replace(/^[-•*]\s*/, '')));
  }

  // 纯行文本作为 notices
  const plainLines = text.split('\n').filter(l => {
    const t = l.trim();
    return t && !t.includes('：') && !t.includes(':');
  });
  if (noticeField && plainLines.length > 0) {
    if (!result[noticeField]) result[noticeField] = [];
    for (const line of plainLines) {
      const cleaned = line.replace(/^[-•*\d]+[.)、]\s*/, '').trim();
      if (cleaned) result[noticeField].push(cleaned);
    }
  }

  // 合并：如果有现有notices但各字段匹配到了部分，仅追加未重复的
  const confidence = Object.keys(result).length > 0 ? 0.5 + Object.keys(result).length * 0.1 : 0;
  return { data: result, confidence: Math.min(0.9, confidence), stats: { total: Object.keys(result).length } };
}

// ========== URL 解析 ==========

async function parseUrl(url, moduleName) {
  // SSRF 防护：禁止访问内网地址
  try {
    const urlObj = new URL(url);
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
    if (blockedHosts.includes(urlObj.hostname) ||
        urlObj.hostname.startsWith('192.168.') ||
        urlObj.hostname.startsWith('10.') ||
        urlObj.hostname.startsWith('172.16.') ||
        urlObj.hostname === '0.0.0.0') {
      return { data: null, confidence: 0, error: '不允许访问内网地址' };
    }
  } catch (e) {
    return { data: null, confidence: 0, error: '无效的 URL 格式' };
  }

  let html;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SuShuo-Bot/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return { data: null, confidence: 0, error: `网页返回 ${resp.status}` };
    html = await resp.text();
  } catch (e) {
    if (e.name === 'TimeoutError') return { data: null, confidence: 0, error: '网页请求超时' };
    return { data: null, confidence: 0, error: '无法访问该网页: ' + e.message };
  }

  const cheerio = tryRequire('cheerio');
  if (!cheerio) return { data: null, confidence: 0, error: 'URL 解析需要安装 cheerio 依赖: npm install cheerio' };

  const $ = cheerio.load(html);

  // 移除脚本和样式
  $('script, style, nav, footer, header, .nav, .footer, .header, .sidebar').remove();

  // 策略1: 从表格提取
  const tables = $('table');
  if (tables.length > 0) {
    const results = extractFromTable($, tables.first(), moduleName);
    if (results && results.data && results.data.items && results.data.items.length > 0) {
      return results;
    }
  }

  // 策略2: 从列表提取
  const listItems = $('li, .list-item, .card-item, article, .item, [class*="card"], [class*="item"]');
  if (listItems.length >= 2) {
    const items = [];
    listItems.each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text.length > 3) items.push(text);
    });
    if (items.length >= 2) {
      return mapTextToModule(items.join('\n\n'), moduleName);
    }
  }

  // 策略3: 提取主体内容按标题拆分
  const body = $('main, article, .content, .main, #content, #main, .post, .article').first();
  const contentEl = body.length > 0 ? body : $('body');
  const headings = contentEl.find('h2, h3, h4');
  if (headings.length >= 2) {
    const items = [];
    headings.each((_, h) => {
      const title = $(h).text().trim();
      let desc = '';
      let next = $(h).next();
      while (next.length && !next.is('h2, h3, h4')) {
        const t = next.text().trim();
        if (t) desc += (desc ? '\n' : '') + t;
        next = next.next();
      }
      if (title) items.push(`${title}：${desc}`);
    });
    if (items.length > 0) {
      return mapTextToModule(items.join('\n\n'), moduleName);
    }
  }

  // 策略4: 全文提取
  const bodyText = contentEl.text().replace(/\n{3,}/g, '\n\n').trim();
  return mapTextToModule(bodyText, moduleName);
}

function extractFromTable($, table, moduleName) {
  const headers = [];
  table.find('thead tr th, tr:first-child th, tr:first-child td').each((_, th) => {
    headers.push($(th).text().trim());
  });
  if (headers.length === 0) return null;

  const aliasMap = buildAliasMap(moduleName);
  const colMap = headers.map(h => aliasMap[h.toLowerCase()] || null);

  // 至少有一列能映射
  if (colMap.every(c => c === null)) return null;

  const items = [];
  // 跳过表头行
  const dataRows = headers.length > 0 && table.find('thead').length > 0
    ? table.find('tbody tr')
    : table.find('tr').slice(1);

  dataRows.each((_, row) => {
    const cells = $(row).find('td, th');
    const item = {};
    cells.each((i, cell) => {
      if (i < colMap.length && colMap[i]) {
        item[colMap[i]] = $(cell).text().trim();
      }
    });
    if (item.name) items.push(item);
  });

  if (items.length === 0) return null;
  const schema = MODULES[moduleName];
  return {
    data: { [schema.wrapperKey]: items, ...(schema.hasTopLevel || {}) },
    confidence: 0.7,
    stats: { total: items.length },
  };
}

// ========== 文件解析 ==========

async function parseFile(buffer, filename, moduleName) {
  const ext = filename.split('.').pop().toLowerCase();

  if (ext === 'json') {
    return parseJsonFile(buffer, moduleName);
  }
  if (ext === 'csv') {
    return parseCsvFile(buffer, moduleName);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelFile(buffer, moduleName);
  }
  if (ext === 'txt') {
    return mapTextToModule(buffer.toString('utf-8'), moduleName);
  }

  return { data: null, confidence: 0, error: `不支持的文件格式: .${ext}` };
}

function parseJsonFile(buffer, moduleName) {
  try {
    const parsed = JSON.parse(buffer.toString('utf-8'));
    const schema = MODULES[moduleName];
    if (!schema) return { data: null, confidence: 0, error: '不支持的模块' };

    // 如果已经是标准格式
    if (schema.wrapperKey && parsed[schema.wrapperKey]) {
      return { data: parsed, confidence: 0.95, stats: { total: parsed[schema.wrapperKey].length } };
    }
    // 如果是数组
    if (Array.isArray(parsed)) {
      return { data: { [schema.wrapperKey || 'items']: parsed }, confidence: 0.8, stats: { total: parsed.length } };
    }
    // 尝试按字段映射
    if (typeof parsed === 'object') {
      return { data: parsed, confidence: 0.6, stats: { total: Object.keys(parsed).length } };
    }
  } catch (e) {
    return { data: null, confidence: 0, error: 'JSON 解析失败: ' + e.message };
  }
  return { data: null, confidence: 0, error: '无法识别的 JSON 结构' };
}

function parseCsvFile(buffer, moduleName) {
  const Papa = tryRequire('papaparse');
  if (!Papa) return { data: null, confidence: 0, error: 'CSV 解析需要安装 papaparse: npm install papaparse' };

  const text = buffer.toString('utf-8');
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0 && result.data.length === 0) {
    return { data: null, confidence: 0, error: 'CSV 解析错误: ' + result.errors[0].message };
  }

  const rows = result.data;
  if (rows.length === 0) return { data: null, confidence: 0, error: 'CSV 文件中没有数据' };

  const aliasMap = buildAliasMap(moduleName);
  const schema = MODULES[moduleName];
  const originalHeaders = result.meta.fields || [];

  // 映射列名
  const colMap = originalHeaders.map(h => aliasMap[h.toLowerCase()] || null);
  const items = [];

  for (const row of rows) {
    const item = {};
    for (let i = 0; i < originalHeaders.length; i++) {
      if (colMap[i] && row[originalHeaders[i]]) {
        const val = row[originalHeaders[i]].trim();
        if (val) {
          item[colMap[i]] = convertValue(val, schema.shape[colMap[i]]?.type || 'string');
        }
      }
    }
    if (item.name || item.title) {
      if (!item.name && item.title) {
        item.name = item.title;
        delete item.title;
      }
      items.push(item);
    }
  }

  if (items.length === 0) {
    // 尝试更宽松的匹配：第一列作为name，第二列作为description
    for (const row of rows) {
      const vals = Object.values(row).filter(v => v && v.trim());
      if (vals.length >= 1) {
        const item = { name: String(vals[0]).trim() };
        if (vals.length >= 2) item.description = String(vals[1]).trim();
        items.push(item);
      }
    }
  }

  return {
    data: { [schema.wrapperKey]: items, ...(schema.hasTopLevel || {}) },
    confidence: items.length > 0 ? 0.6 : 0,
    stats: { total: items.length },
  };
}

function parseExcelFile(buffer, moduleName) {
  const XLSX = tryRequire('xlsx');
  if (!XLSX) return { data: null, confidence: 0, error: 'Excel 解析需要安装 xlsx: npm install xlsx' };

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { data: null, confidence: 0, error: 'Excel 文件中没有工作表' };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (rows.length === 0) return { data: null, confidence: 0, error: 'Excel 工作表中没有数据' };

  // 转为 CSV 文本，复用 CSV 解析逻辑
  const csvText = rowsToCsvText(rows);
  return parseCsvFile(Buffer.from(csvText, 'utf-8'), moduleName);
}

function rowsToCsvText(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    const vals = headers.map(h => {
      const v = String(row[h] ?? '');
      return v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

// ========== 工具函数 ==========

function splitIntoChunks(text) {
  // 先尝试按编号分割
  const numberedPattern = /(?:^|\n)(?:\d+[.)、]|[一二三四五六七八九十]+[、.]|[（(]\d+[）)])/;
  if (numberedPattern.test(text)) {
    const parts = text.split(/\n(?=\d+[.)、])|\n(?=[一二三四五六七八九十]+[、.])/);
    if (parts.length > 1) return parts;
  }

  // 按空行分割
  const chunks = text.split(/\n\s*\n/);
  if (chunks.length > 1) return chunks;

  // 按单行处理：如果大部分行有分隔符（名称 - 描述模式），逐行作为独立条目
  const lines = text.split('\n').filter(l => l.trim());
  const separatorLines = lines.filter(l => findSeparator(l) > 0 && findSeparator(l) < 30);
  // 超过一半的行有分隔符 → 每行都是独立条目
  if (separatorLines.length > lines.length / 2) {
    return lines;
  }
  // 否则按两行一组
  const result = [];
  for (let i = 0; i < lines.length; i += 2) {
    result.push(lines.slice(i, i + 2).join('\n'));
  }
  return result;
}

function findSeparator(line) {
  const colonIdx = line.indexOf('：');
  const semiIdx = line.indexOf(':');
  const dashIdx = line.indexOf(' - ');
  const emdashIdx = line.indexOf(' — ');

  const indices = [colonIdx, semiIdx, dashIdx, emdashIdx].filter(i => i > 0);
  if (indices.length === 0) return -1;
  const idx = Math.min(...indices);
  // 如果是 - 或 — 分隔符，跳过分隔符长度
  if (idx === dashIdx) return line.indexOf(' - ') + 1;
  if (idx === emdashIdx) return line.indexOf(' — ') + 1;
  return idx;
}

function convertValue(value, type) {
  if (type === 'number') {
    const cleaned = value.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? value : num;
  }
  if (type === 'boolean') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '是' || lower === 'yes' || lower === '1';
  }
  return value;
}

function tryRequire(pkg) {
  try { return require(pkg); } catch (e) { return null; }
}

module.exports = { mapTextToModule, parseUrl, parseFile };
