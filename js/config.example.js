/**
 * 配置文件示例 — 复制此文件为 config.js 并填入你自己的值
 *
 * 生成密码哈希方法（在浏览器控制台运行）:
 *   crypto.subtle.digest('SHA-256', new TextEncoder().encode('你的密码'))
 *     .then(buf => console.log(Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')))
 */
const SITE_CONFIG = {
  // 将下方字符串替换为你自己密码的 SHA-256 哈希值
  adminPasswordHash: 'YOUR_SHA256_HASH_HERE'
};
