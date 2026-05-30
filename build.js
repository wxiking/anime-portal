const fs = require('fs');
const hash = process.env.CF_ADMIN_HASH || '';
if (!hash) {
  console.warn('[build] 警告: CF_ADMIN_HASH 未设置，管理员登录将无法使用');
}
fs.writeFileSync('js/config.js', `const SITE_CONFIG = { adminPasswordHash: '${hash}' };\n`);
console.log('[build] config.js 已生成');
