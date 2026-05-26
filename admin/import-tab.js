// import-tab.js — 数据导入 Tab
'use strict';
(function() {
window.loadImport = function() {
  const main = document.getElementById('mainContent');
  const slug = window.location.pathname.split('/p/')[1]?.split('/')[0] || '';
  let state = { step: 1, method: '', targetModule: 'attractions', parsedData: null };

  const MODULES = [
    { id: 'attractions', label: '景区攻略' },
    { id: 'food', label: '周边小吃' },
    { id: 'routes', label: '到达路线' },
    { id: 'products', label: '民宿好物' },
    { id: 'guide', label: '入住导引' },
    { id: 'tips', label: '温馨提示' },
    { id: 'facilities', label: '酒店设施' },
    { id: 'business', label: '商务服务' },
    { id: 'nearby', label: '周边便利' },
  ];

  function modOptions(sel) {
    return MODULES.map(m => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${m.label}</option>`).join('');
  }

  renderStep1();

  function renderStep1() {
    state.step = 1; state.parsedData = null;
    const mod = state.targetModule;

    main.innerHTML = `
      <h1>📥 数据导入</h1>
      <p style="color:var(--muted);font-size:13px;margin-bottom:20px;">从网络采集、粘贴文本、上传文件或 AI 生成内容，快速填充模块数据</p>

      <div id="stepBar" style="display:flex;gap:0;margin-bottom:24px;font-size:13px;color:var(--muted);">
        <span style="font-weight:600;color:var(--primary);">① 选择数据源</span>
        <span style="margin:0 10px;color:var(--hairline);">▸</span>
        <span>② 预览编辑</span>
        <span style="margin:0 10px;color:var(--hairline);">▸</span>
        <span>③ 确认保存</span>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:13px;font-weight:600;color:var(--ink);display:block;margin-bottom:6px;">目标模块</label>
        <select id="targetMod" onchange="document._importSetModule(this.value)" style="padding:10px 14px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);min-width:200px;">
          ${modOptions(mod)}
        </select>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
        <div class="method-card ${state.method === 'url' ? 'sel' : ''}" onclick="_importSelect('url')" style="background:var(--surface-card);border:2px solid ${state.method==='url'?'var(--primary)':'var(--hairline)'};border-radius:12px;padding:20px;cursor:pointer;transition:all 0.15s;">
          <div style="font-size:24px;margin-bottom:8px;">🔗</div>
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">网页抓取</div>
          <div style="font-size:12px;color:var(--muted);">输入网址自动提取内容</div>
        </div>
        <div class="method-card ${state.method === 'text' ? 'sel' : ''}" onclick="_importSelect('text')" style="background:var(--surface-card);border:2px solid ${state.method==='text'?'var(--primary)':'var(--hairline)'};border-radius:12px;padding:20px;cursor:pointer;transition:all 0.15s;">
          <div style="font-size:24px;margin-bottom:8px;">📝</div>
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">粘贴文本</div>
          <div style="font-size:12px;color:var(--muted);">粘贴复制的内容自动解析</div>
        </div>
        <div class="method-card ${state.method === 'file' ? 'sel' : ''}" onclick="_importSelect('file')" style="background:var(--surface-card);border:2px solid ${state.method==='file'?'var(--primary)':'var(--hairline)'};border-radius:12px;padding:20px;cursor:pointer;transition:all 0.15s;">
          <div style="font-size:24px;margin-bottom:8px;">📁</div>
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">文件上传</div>
          <div style="font-size:12px;color:var(--muted);">CSV / Excel / JSON / TXT</div>
        </div>
        <div class="method-card ${state.method === 'ai' ? 'sel' : ''}" onclick="_importSelect('ai')" style="background:var(--surface-card);border:2px solid ${state.method==='ai'?'var(--primary)':'var(--hairline)'};border-radius:12px;padding:20px;cursor:pointer;transition:all 0.15s;">
          <div style="font-size:24px;margin-bottom:8px;">🤖</div>
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">AI 生成</div>
          <div style="font-size:12px;color:var(--muted);">用自然语言描述，AI 自动生成</div>
        </div>
      </div>

      <div id="methodArea">${renderMethodInput()}</div>
    `;

    // 绑定全局回调
    document._importSetModule = function(val) { state.targetModule = val; };
  }

  function renderMethodInput() {
    const mod = state.targetModule;
    if (state.method === 'url') {
      return `<div class="fg"><label>网页地址</label><input type="text" id="importUrl" placeholder="https://example.com/attractions" style="width:100%;padding:10px 14px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></div>
        <button class="btn btn-primary" onclick="_importDoParse()">🔍 抓取并解析</button>`;
    }
    if (state.method === 'text') {
      return `<div class="fg"><label>粘贴文本内容</label><textarea id="importText" placeholder="每行一个条目，用 名称：描述 或 名称 - 描述 格式&#10;&#10;例如：&#10;青城山 - 道教名山，世界文化遗产&#10;都江堰 - 千年水利工程" style="width:100%;min-height:180px;padding:12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></textarea></div>
        <button class="btn btn-primary" onclick="_importDoParse()">🔍 解析文本</button>`;
    }
    if (state.method === 'file') {
      return `<div class="fg"><label>选择文件</label><input type="file" id="importFile" accept=".csv,.xlsx,.xls,.json,.txt" style="padding:10px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">支持 CSV、Excel、JSON、TXT 格式。CSV/Excel 第一行应为表头。</p>
        <button class="btn btn-primary" onclick="_importDoParse()">📁 解析文件</button>`;
    }
    if (state.method === 'ai') {
      return `<div class="fg"><label>描述你想要的内容</label><textarea id="importPrompt" placeholder="例如：都江堰附近5个适合带老人小孩游玩的景点" style="width:100%;min-height:100px;padding:12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></textarea></div>
        <div class="fg-row"><div class="fg"><label>数量</label><input type="number" id="importCount" value="5" min="1" max="20" style="width:100px;padding:8px 12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></div></div>
        <button class="btn btn-primary" onclick="_importDoParse()">🤖 AI 生成</button>`;
    }
    return '<p style="color:var(--muted);font-size:14px;">请先选择一种导入方式</p>';
  }

  window._importSelect = function(method) {
    state.method = method;
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('sel'));
    renderStep1();
  };

  window._importDoParse = async function() {
    const apiBase = '/api/p/' + slug + '/admin/import';
    const token = localStorage.getItem('card_token') || '';

    state.targetModule = document.getElementById('targetMod')?.value || state.targetModule;

    const methodName = { url: '网页抓取', text: '文本解析', file: '文件解析', ai: 'AI 生成' }[state.method] || '导入';
    toast('⏳ 正在' + methodName + '...');

    let body, headers;
    if (state.method === 'file') {
      const file = document.getElementById('importFile')?.files[0];
      if (!file) { toast('请选择文件'); return; }
      body = new FormData();
      body.append('file', file);
      body.append('targetModule', state.targetModule);
      headers = { 'Authorization': 'Bearer ' + token };
    } else {
      headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
      if (state.method === 'url') {
        body = JSON.stringify({ method: 'url', targetModule: state.targetModule, url: document.getElementById('importUrl').value.trim() });
      } else if (state.method === 'text') {
        body = JSON.stringify({ method: 'text', targetModule: state.targetModule, text: document.getElementById('importText').value });
      } else if (state.method === 'ai') {
        body = JSON.stringify({ method: 'ai', targetModule: state.targetModule, prompt: document.getElementById('importPrompt').value, count: parseInt(document.getElementById('importCount')?.value || 5) });
      }
    }

    try {
      const r = await fetch(apiBase + '/parse', { method: 'POST', headers, body });
      const d = await r.json();
      if (!r.ok || d.error) { toast('❌ ' + (d.error || '解析失败')); return; }
      state.parsedData = d;
      state.targetModule = d.suggestedModule || state.targetModule;
      toast('✅ 解析完成，共 ' + (d.stats?.total || 0) + ' 条');
      renderStep2();
    } catch (e) {
      toast('❌ 网络错误: ' + e.message);
    }
  };

  function renderStep2() {
    state.step = 2;
    const d = state.parsedData;
    const items = d.data?.items || d.data?.steps || [];
    const isFlat = !d.data?.items && !d.data?.steps;

    main.innerHTML = `
      <h1>📋 预览编辑</h1>
      <div id="stepBar" style="display:flex;gap:0;margin-bottom:24px;font-size:13px;color:var(--muted);">
        <span style="color:var(--accent-green);">✓ ① 选择数据源</span>
        <span style="margin:0 10px;color:var(--hairline);">▸</span>
        <span style="font-weight:600;color:var(--primary);">② 预览编辑</span>
        <span style="margin:0 10px;color:var(--hairline);">▸</span>
        <span>③ 确认保存</span>
      </div>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">
        模块: <strong>${MODULES.find(m=>m.id===state.targetModule)?.label||state.targetModule}</strong> &nbsp;|&nbsp;
        共 <strong>${items.length || Object.keys(d.data||{}).length}</strong> 条 &nbsp;|&nbsp;
        置信度: ${Math.round(d.confidence*100)}%
      </p>

      ${isFlat ? renderFlatPreview(d.data) : renderListPreview(items)}
      <div style="margin-top:20px;display:flex;gap:12px;">
        <button class="btn btn-outline" onclick="window._importBack()">← 返回</button>
        <button class="btn btn-primary" onclick="window._importCollect()">下一步 →</button>
      </div>
    `;
  }

  function renderListPreview(items) {
    if (items.length === 0) return '<p style="color:var(--muted);">没有解析到数据。请返回调整输入内容。</p>';

    const keys = Object.keys(items[0] || {});
    let html = '<div class="dyn-list" id="previewList">';
    items.forEach((item, i) => {
      html += `<div class="dyn-item"><div class="dyn-header"><strong>#${i+1}</strong><a onclick="this.closest('.dyn-item').remove()" style="color:var(--error);font-size:12px;cursor:pointer;">删除</a></div>`;
      keys.forEach(k => {
        const val = item[k] ?? '';
        html += `<div class="fg"><label>${k}</label><input type="text" value="${esc(val)}" data-idx="${i}" data-field="${k}" style="width:100%;padding:8px 12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></div>`;
      });
      html += '</div>';
    });
    html += '</div>';
    html += `<button class="btn btn-outline btn-sm" onclick="window._importAddRow()" style="margin-top:12px;">➕ 添加一行</button>`;
    return html;
  }

  function renderFlatPreview(data) {
    if (!data) return '<p style="color:var(--muted);">没有解析到数据。</p>';
    let html = '<div style="background:var(--surface-soft);padding:16px;border-radius:12px;border:1px solid var(--hairline);">';
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) {
        html += `<div class="fg"><label>${k}</label>`;
        v.forEach((item, i) => {
          html += `<div style="display:flex;gap:8px;margin-bottom:4px;"><input type="text" value="${esc(item)}" data-field="${k}" data-idx="${i}" style="flex:1;padding:8px 12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"><a onclick="this.parentElement.remove()" style="color:var(--error);font-size:12px;cursor:pointer;align-self:center;">删除</a></div>`;
        });
        html += `</div>`;
      } else {
        html += `<div class="fg"><label>${k}</label><input type="text" value="${esc(v||'')}" data-field="${k}" style="width:100%;padding:8px 12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></div>`;
      }
    }
    html += '</div>';
    return html;
  }

  window._importAddRow = function() {
    const list = document.getElementById('previewList');
    if (!list) return;
    const existing = list.querySelectorAll('.dyn-item');
    const keys = [];
    list.querySelectorAll('.dyn-item:first-child input').forEach(inp => keys.push(inp.dataset.field));
    if (keys.length === 0) {
      // 从现有 items 推断
      const d = state.parsedData;
      const sample = d.data?.items?.[0] || {};
      Object.keys(sample).forEach(k => keys.push(k));
    }
    const idx = existing.length;
    let html = `<div class="dyn-item"><div class="dyn-header"><strong>#${idx+1}</strong><a onclick="this.closest('.dyn-item').remove()" style="color:var(--error);font-size:12px;cursor:pointer;">删除</a></div>`;
    keys.forEach(k => {
      html += `<div class="fg"><label>${k}</label><input type="text" value="" data-idx="${idx}" data-field="${k}" style="width:100%;padding:8px 12px;border:1px solid var(--hairline);border-radius:8px;font-size:14px;background:var(--surface-card);"></div>`;
    });
    html += '</div>';
    list.insertAdjacentHTML('beforeend', html);
  };

  window._importBack = function() {
    state.parsedData = null;
    renderStep1();
  };

  window._importCollect = function() {
    const d = state.parsedData;
    const isFlat = !d.data?.items && !d.data?.steps;

    if (isFlat) {
      const collected = {};
      document.querySelectorAll('[data-field]').forEach(el => {
        const field = el.dataset.field;
        const idx = el.dataset.idx;
        if (idx !== undefined && idx !== '') {
          if (!collected[field]) collected[field] = [];
          collected[field][parseInt(idx)] = el.value;
        } else {
          collected[field] = el.value;
        }
      });
      // Clean up sparse arrays
      for (const k of Object.keys(collected)) {
        if (Array.isArray(collected[k])) collected[k] = collected[k].filter(v => v !== undefined && v !== null);
      }
      state.parsedData = { ...d, data: collected };
    } else {
      const wrapperKey = d.data?.items ? 'items' : 'steps';
      const items = [];
      const itemEls = document.querySelectorAll('#previewList .dyn-item');
      itemEls.forEach(el => {
        const item = {};
        el.querySelectorAll('input').forEach(inp => {
          item[inp.dataset.field] = inp.value;
        });
        // Skip fully empty items
        if (Object.values(item).some(v => v && v.trim())) items.push(item);
      });
      state.parsedData = { ...d, data: { [wrapperKey]: items } };
    }

    renderStep3();
  };

  function renderStep3() {
    state.step = 3;
    const items = state.parsedData.data?.items || state.parsedData.data?.steps || [];
    const total = items.length || Object.keys(state.parsedData.data||{}).length;

    main.innerHTML = `
      <h1>💾 确认保存</h1>
      <div id="stepBar" style="display:flex;gap:0;margin-bottom:24px;font-size:13px;color:var(--muted);">
        <span style="color:var(--accent-green);">✓ ① 选择数据源</span>
        <span style="margin:0 10px;color:var(--hairline);">▸</span>
        <span style="color:var(--accent-green);">✓ ② 预览编辑</span>
        <span style="margin:0 10px;color:var(--hairline);">▸</span>
        <span style="font-weight:600;color:var(--primary);">③ 确认保存</span>
      </div>

      <div style="background:var(--surface-card);border-radius:12px;padding:24px;border:1px solid var(--hairline);max-width:500px;">
        <div style="margin-bottom:20px;">
          <p style="font-size:14px;color:var(--ink);margin-bottom:8px;">即将写入 <strong>${MODULES.find(m=>m.id===state.targetModule)?.label||state.targetModule}</strong> 模块</p>
          <p style="font-size:13px;color:var(--muted);">共 <strong>${total}</strong> 条数据</p>
        </div>

        <div class="fg">
          <label>保存模式</label>
          <div style="display:flex;gap:16px;margin-top:8px;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
              <input type="radio" name="saveMode" value="replace" checked> 替换现有数据
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
              <input type="radio" name="saveMode" value="merge"> 追加到现有数据（去重）
            </label>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-top:20px;">
          <button class="btn btn-outline" onclick="window._importBackToEdit()">← 返回编辑</button>
          <button class="btn btn-primary" onclick="window._importDoSave()">💾 保存数据</button>
        </div>
        <p id="saveMsg" style="margin-top:12px;font-size:13px;"></p>
      </div>
    `;
  }

  window._importBackToEdit = function() { state.step = 2; renderStep2(); };

  window._importDoSave = async function() {
    const token = localStorage.getItem('card_token') || '';
    const mode = document.querySelector('input[name="saveMode"]:checked')?.value || 'replace';

    try {
      const r = await fetch('/api/p/' + slug + '/admin/import/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ targetModule: state.targetModule, data: state.parsedData.data, mode })
      });
      const d = await r.json();
      const el = document.getElementById('saveMsg');
      if (d.success) {
        el.style.color = 'var(--accent-green)';
        el.textContent = '✅ 保存成功！已写入 ' + d.written + ' 条数据（模式: ' + (d.mode==='merge'?'追加':'替换') + '）';
        toast('✅ 数据已保存');
        // 重置状态
        setTimeout(() => { state = { step: 1, method: '', targetModule: state.targetModule, parsedData: null }; renderStep1(); }, 2000);
      } else {
        el.style.color = 'var(--error)';
        el.textContent = '❌ 保存失败: ' + (d.error || '未知错误');
      }
    } catch (e) {
      document.getElementById('saveMsg').style.color = 'var(--error)';
      document.getElementById('saveMsg').textContent = '❌ 网络错误: ' + e.message;
    }
  };
};
})();
