// ai-adapter.js — AI 生成适配器（可插拔，运行时检测）
const { MODULES, getDefaultData } = require('./schemas');

function buildSystemPrompt(moduleName, count) {
  const schema = MODULES[moduleName];
  if (!schema) return '';

  const fields = Object.entries(schema.shape)
    .map(([name, def]) => `  - ${name}: ${def.type}${def.required ? '（必填）' : '（选填）'}`)
    .join('\n');

  const wrapperKey = schema.wrapperKey;
  const jsonShape = wrapperKey
    ? `{ "${wrapperKey}": [ { ${Object.keys(schema.shape).map(f => `"${f}": "..."`).join(', ')} } ] }`
    : `{ ${Object.keys(schema.shape).map(f => `"${f}": "..."`).join(', ')} }`;

  return `你是一个旅游/民宿内容生成助手。请根据用户提供的民宿位置和需求，生成 ${count} 条"${moduleName}"模块的推荐内容。

模块字段说明：
${fields}

请严格按以下 JSON 格式返回，不要包含任何其他内容（不要markdown代码块标记）：
${jsonShape}

内容要求：
- 使用中文
- 描述要生动具体（30-80字）
- 信息要真实可信
- 如果是景点/美食类，优先推荐当地知名的`;
}

async function generateWithAI(moduleName, prompt, count = 5) {
  const provider = process.env.IMPORT_AI_PROVIDER;
  if (!provider) {
    return { data: null, confidence: 0, error: 'AI 导入未配置。请设置环境变量 IMPORT_AI_PROVIDER（anthropic 或 openai）和对应的 API Key' };
  }

  const systemPrompt = buildSystemPrompt(moduleName, count);
  if (!systemPrompt) {
    return { data: null, confidence: 0, error: `不支持的模块类型: ${moduleName}` };
  }

  try {
    let rawJson;
    if (provider === 'anthropic') {
      rawJson = await callAnthropic(systemPrompt, prompt);
    } else if (provider === 'openai') {
      rawJson = await callOpenAI(systemPrompt, prompt);
    } else {
      return { data: null, confidence: 0, error: `不支持的 AI 提供商: ${provider}。支持: anthropic, openai` };
    }

    // 解析和校验返回的 JSON
    const parsed = JSON.parse(rawJson);
    const schema = MODULES[moduleName];

    if (schema.wrapperKey) {
      const items = parsed[schema.wrapperKey] || [];
      const requiredFields = Object.entries(schema.shape)
        .filter(([, d]) => d.required)
        .map(([f]) => f);
      const validItems = items.filter(item => requiredFields.every(f => item[f]));
      return {
        data: { [schema.wrapperKey]: validItems, ...(schema.hasTopLevel || {}) },
        confidence: validItems.length > 0 ? 0.85 : 0,
        stats: { total: validItems.length },
      };
    }

    return { data: parsed, confidence: 0.85, stats: { total: Object.keys(parsed).length } };
  } catch (e) {
    if (e.name === 'SyntaxError') {
      return { data: null, confidence: 0, error: 'AI 返回的内容格式不正确，请重试' };
    }
    return { data: null, confidence: 0, error: `AI 服务调用失败: ${e.message}` };
  }
}

async function callAnthropic(systemPrompt, userPrompt) {
  const Anthropic = tryRequire('@anthropic-ai/sdk');
  if (!Anthropic) {
    throw new Error('请安装 Anthropic SDK: npm install @anthropic-ai/sdk');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('请设置 ANTHROPIC_API_KEY 环境变量');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: `民宿/地点：${userPrompt}\n\n请生成推荐内容。` }],
  });
  return msg.content[0].text;
}

async function callOpenAI(systemPrompt, userPrompt) {
  const OpenAI = tryRequire('openai');
  if (!OpenAI) {
    throw new Error('请安装 OpenAI SDK: npm install openai');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('请设置 OPENAI_API_KEY 环境变量');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `民宿/地点：${userPrompt}\n\n请生成推荐内容。` },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return completion.choices[0].message.content;
}

function tryRequire(pkg) {
  try { return require(pkg); } catch (e) { return null; }
}

module.exports = { generateWithAI };
