// schemas.js — 模块数据 schema 定义 + 中文字段别名映射
// 用于解析阶段自动匹配非结构化输入中的字段名

const MODULES = {
  attractions: {
    wrapperKey: 'items',
    hasTopLevel: { guideMapImage: '' },
    shape: {
      name: { type: 'string', required: true, aliases: ['景点名', '名称', '景区', '名字', 'title', '景区名称', '景点', '标题', '地点', '目的地'] },
      description: { type: 'string', required: false, aliases: ['简介', '介绍', '描述', '说明', 'content', '详情', '内容', '摘要'] },
      image: { type: 'string', required: false, aliases: ['图片', '照片', '封面', 'img', 'image', '图像', '配图'] },
      guideMapImage: { type: 'string', required: false, aliases: ['导览图', '地图', 'guideMap'] },
    },
  },
  food: {
    wrapperKey: 'items',
    hasTopLevel: null,
    shape: {
      name: { type: 'string', required: true, aliases: ['店名', '餐厅', '小吃', '名称', '名字', '饭店', '美食', '餐厅名', '铺名', '摊位'] },
      dish: { type: 'string', required: false, aliases: ['推荐菜', '招牌', '拿手菜', '特色菜', '推荐', '必点', '菜品', '拿手'] },
      description: { type: 'string', required: false, aliases: ['简介', '介绍', '描述', '说明', '评价', '口味', 'content', '详情'] },
      lat: { type: 'number', required: false, aliases: ['纬度', 'lat', 'latitude'] },
      lng: { type: 'number', required: false, aliases: ['经度', 'lng', 'longitude', 'lon'] },
      image: { type: 'string', required: false, aliases: ['图片', '照片', '封面', 'img', 'image', '配图'] },
    },
  },
  routes: {
    wrapperKey: 'items',
    hasTopLevel: null,
    shape: {
      from: { type: 'string', required: true, aliases: ['出发地', '从哪里', '起点', '出发', 'from', '从哪里来', '来源地'] },
      method: { type: 'string', required: false, aliases: ['交通', '方式', '怎么走', 'method', '交通方式', '如何到达', '出行方式'] },
      description: { type: 'string', required: false, aliases: ['路线', '说明', '详情', '描述', '具体路线', '内容'] },
    },
  },
  products: {
    wrapperKey: 'items',
    hasTopLevel: null,
    shape: {
      name: { type: 'string', required: true, aliases: ['商品名', '产品', '名称', '商品', '名字', 'title', '品名'] },
      price: { type: 'number', required: false, aliases: ['价格', '售价', '元', '价钱', 'price', '金额', '单价'] },
      description: { type: 'string', required: false, aliases: ['简介', '介绍', '描述', '说明', '详情', 'content', '内容'] },
      image: { type: 'string', required: false, aliases: ['图片', '照片', 'img', 'image', '配图'] },
      wechat: { type: 'string', required: false, aliases: ['微信', '微信号', 'wechat'] },
      phone: { type: 'string', required: false, aliases: ['电话', '手机', '手机号', 'phone', '联系电话'] },
    },
  },
  guide: {
    wrapperKey: 'steps',
    hasTopLevel: null,
    shape: {
      title: { type: 'string', required: true, aliases: ['标题', '步骤', '名称', 'step', 'title', '环节'] },
      description: { type: 'string', required: false, aliases: ['说明', '描述', '内容', '详情', 'content'] },
      image: { type: 'string', required: false, aliases: ['图片', '照片', 'img', 'image', '配图'] },
    },
  },
  tips: {
    wrapperKey: null,
    hasTopLevel: null,
    shape: {
      wifi: { type: 'string', required: false, aliases: ['WiFi', 'wifi名', '无线', 'wifi名称', '网络', '无线网'] },
      wifiPassword: { type: 'string', required: false, aliases: ['密码', 'WiFi密码', 'wifi密码', '无线密码'] },
      checkOutTime: { type: 'string', required: false, aliases: ['退房', '退房时间', 'checkout', '退房时间点'] },
      emergencyPhone: { type: 'string', required: false, aliases: ['紧急电话', '联系电话', '紧急', '电话', '急救'] },
      notices: { type: 'array', required: false, aliases: ['须知', '注意事项', '注意', '提示', '提醒'] },
    },
  },
  facilities: {
    wrapperKey: 'items',
    hasTopLevel: null,
    shape: {
      name: { type: 'string', required: true, aliases: ['设施', '名称', '名字', 'title', '设备', '配置'] },
      description: { type: 'string', required: false, aliases: ['描述', '说明', '介绍', '详情', '内容'] },
    },
  },
  business: {
    wrapperKey: 'items',
    hasTopLevel: null,
    shape: {
      name: { type: 'string', required: true, aliases: ['服务', '名称', '名字', 'title', '商务', '项目'] },
      description: { type: 'string', required: false, aliases: ['描述', '说明', '介绍', '详情', '内容'] },
    },
  },
  nearby: {
    wrapperKey: 'items',
    hasTopLevel: null,
    shape: {
      name: { type: 'string', required: true, aliases: ['地点', '名称', '名字', '场所', 'title', '周边'] },
      description: { type: 'string', required: false, aliases: ['描述', '说明', '介绍', '详情', '内容'] },
      lat: { type: 'number', required: false, aliases: ['纬度', 'lat', 'latitude'] },
      lng: { type: 'number', required: false, aliases: ['经度', 'lng', 'longitude', 'lon'] },
    },
  },
};

// 构建字段名 → 标准字段的快速反向索引
function buildAliasMap(moduleName) {
  const schema = MODULES[moduleName];
  if (!schema) return {};
  const map = {};
  for (const [field, def] of Object.entries(schema.shape)) {
    for (const alias of def.aliases) {
      map[alias.toLowerCase()] = field;
    }
    map[field.toLowerCase()] = field;
  }
  return map;
}

// 获取模块的默认数据模板
function getDefaultData(moduleName) {
  const schema = MODULES[moduleName];
  if (!schema) return null;
  if (schema.wrapperKey) {
    const result = { [schema.wrapperKey]: [] };
    if (schema.hasTopLevel) Object.assign(result, schema.hasTopLevel);
    return result;
  }
  // flat structure (tips)
  const result = {};
  for (const field of Object.keys(schema.shape)) {
    result[field] = schema.shape[field].type === 'array' ? [] : '';
  }
  return result;
}

// 获取模块的必填字段列表
function getRequiredFields(moduleName) {
  const schema = MODULES[moduleName];
  if (!schema) return [];
  return Object.entries(schema.shape)
    .filter(([, def]) => def.required)
    .map(([field]) => field);
}

module.exports = { MODULES, buildAliasMap, getDefaultData, getRequiredFields };
