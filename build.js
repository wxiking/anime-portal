const fs = require('fs');
const crypto = require('crypto');
const password = process.env.CF_ADMIN_PASSWORD || '';
if (!password) {
  console.warn('[build] 警告: CF_ADMIN_PASSWORD 未设置，管理员登录将无法使用');
}
const hash = password ? crypto.createHash('sha256').update(password).digest('hex') : '';
fs.writeFileSync('js/config.js', `var SITE_CONFIG = { adminPasswordHash: '${hash}' };\n`);
console.log('[build] config.js 已生成');
