const fs = require('fs');
// 密码哈希现在存储在 KV 中，通过后台"修改密码"管理，此文件仅生成空配置
fs.writeFileSync('js/config.js', `var SITE_CONFIG = { adminPasswordHash: '' };\n`);
console.log('[build] config.js 已生成');
