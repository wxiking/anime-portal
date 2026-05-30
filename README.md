# 流光星野 · 二次元毛玻璃个人门户

一个以动漫美学为核心、支持后台实时同步的个人网站导航门户。完全静态，零服务器，免费部署在 Cloudflare Pages。后台修改数据后，所有访客即时看到最新内容，无需手动导出或重新部署。

## 功能特性

- **毛玻璃 + 动漫风** — 落樱粒子、闪烁星空、霓虹光晕卡片
- **全后台管理** — 网站列表、分类、联系方式、站点基础设置
- **实时云端同步** — 后台保存 → Cloudflare KV → 全球所有访客立即更新
- **安全认证** — SHA-256 密码哈希、5次失败锁定 30 秒、服务端限速
- **响应式** — 完整的移动端适配，侧边栏抽屉
- **零依赖** — 不引入任何第三方框架，原生 JS + CSS，极速加载
- **本地缓存** — localStorage 双层缓存，断网仍可访问历史数据

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare Pages                   │
│                                                     │
│  index.html / admin/         functions/api/data.js  │
│  (静态前端 + 后台 UI)    ←→  (Pages Function API)   │
│                                    ↓                │
│                          KV Namespace: PORTAL_DATA  │
│                          (key: "all" → JSON 全量数据)│
└─────────────────────────────────────────────────────┘

访客流程：
  1. 浏览器加载页面 → 渲染 localStorage 缓存（0ms 感知延迟）
  2. 后台拉取 GET /api/data → 用 KV 数据更新 localStorage → 重渲染

管理员流程：
  1. 登录后台 → 修改内容 → 点击保存
  2. 自动 POST /api/data（Bearer 密码认证）→ 写入 KV
  3. 所有访客下次打开/刷新立即看到新数据
```

## 快速开始

### 第一步：Fork 仓库

点击右上角 **Fork**，将此仓库 Fork 到你的 GitHub 账户。

### 第二步：生成你的密码哈希

在**任意浏览器控制台**运行以下代码，将 `你的密码` 替换为你想设置的密码：

```javascript
crypto.subtle.digest('SHA-256', new TextEncoder().encode('你的密码'))
  .then(buf => console.log(
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  ));
```

复制输出的 64 位十六进制字符串，这就是你的 `CF_ADMIN_HASH`。

### 第三步：配置 GitHub Secrets

在你 Fork 的仓库中，进入 **Settings → Secrets and variables → Actions**，添加以下 3 个 Secret：

| Secret 名称 | 填写内容 |
|---|---|
| `CF_ADMIN_HASH` | 第二步生成的 SHA-256 哈希值 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需要 Pages 和 Workers 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare Account ID |

**获取 Cloudflare API Token：**  
Cloudflare Dashboard → My Profile → API Tokens → Create Token → 使用 `Edit Cloudflare Workers` 模板，并额外添加 `Cloudflare Pages: Edit` 权限。

**获取 Account ID：**  
Cloudflare Dashboard 右侧边栏 → 复制 Account ID。

### 第四步：创建 Cloudflare Pages 项目

在 Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git，选择你 Fork 的仓库。

**构建配置：**
- 构建命令：`node build.js`
- 输出目录：`.`（保持默认即可）
- 根目录：`/`

首次部署完成后，记下你的项目名称（例如 `anime-portal`）。

### 第五步：创建并绑定 KV 命名空间

1. Cloudflare Dashboard → Workers & Pages → KV → Create namespace  
   名称填 `PORTAL_DATA`，创建后复制 Namespace ID

2. 进入你的 Pages 项目 → Settings → Functions → KV namespace bindings  
   添加绑定：Variable name = `PORTAL_DATA`，KV namespace = 刚创建的命名空间

   或者使用 Wrangler CLI 命令：
   ```bash
   npm install -g wrangler
   wrangler login
   wrangler kv namespace create PORTAL_DATA
   # 复制输出的 ID，然后通过 Dashboard 手动绑定
   ```

3. 设置 Pages Function 密钥：
   ```bash
   echo -n "你的密码的SHA256哈希" | wrangler pages secret put ADMIN_HASH --project-name 你的项目名
   ```

### 第六步：推送触发自动部署

提交任意修改（或直接在 GitHub 上编辑一个文件保存），GitHub Actions 会自动：
1. 生成 `js/config.js`（包含密码哈希，用于前端登录验证）
2. 部署到 Cloudflare Pages
3. 同步更新 `ADMIN_HASH` 密钥到 Pages Function

部署完成后，访问 `https://你的项目名.pages.dev` 即可看到门户。

---

## 使用后台管理

访问 `https://你的域名/admin`，输入密码登录。

| 功能 | 说明 |
|---|---|
| 网站管理 | 增删改查展示的网站卡片，支持分页和搜索 |
| 添加网站 | 填写名称、链接、分类、状态、标签等信息 |
| 分类管理 | 添加/删除前台筛选栏的分类标签 |
| 联系方式 | 修改 GitHub、邮箱、微信、QQ 等信息 |
| 基础设置 | 网站名、作者名、头像、签名、版权署名 |
| 导出配置 | 下载当前数据的 JS 备份文件 |

所有保存操作会在 1 秒内同步到 Cloudflare KV，访客刷新页面即可看到最新内容。

---

## 修改密码

**本地修改（当前浏览器生效）：**  
后台 → 修改密码 → 输入当前密码和新密码。

> ⚠️ 注意：此操作仅修改当前浏览器的登录验证。下次以新密码重新登录后，后台保存操作将因云端认证不匹配而失败（显示 "云端同步失败：认证过期"）。

**彻底修改（跨设备、云端同步生效）：**
1. 生成新密码的 SHA-256 哈希（见第二步）
2. 在 GitHub 仓库 Secrets 中更新 `CF_ADMIN_HASH`
3. 推送任意 commit 触发重新部署

---

## 自定义外观

### 修改默认展示数据

编辑 `js/data.js` — 修改 `initialWebsitesData` 数组中的网站数据，这是首次加载（KV 为空时）显示的默认内容。

### 修改网站名称/作者信息

有两种方式：
- **后台管理**（推荐）：基础设置页面实时修改
- **代码**：修改 `js/main.js` 顶部的 `DEFAULT_SITE_SETTINGS` 对象

### 修改样式

编辑 `css/style.css`。主色调变量在文件顶部 `:root {}` 中定义。

---

## 安全说明

- 管理员密码**从不**以明文存储，只在登录会话期间保存在 JS 内存中，页面关闭即清除
- 所有后台写操作需通过 SHA-256 密码哈希认证
- API 端点有服务端限速保护：同一 IP 每分钟最多 15 次 POST 请求
- 登录页面有前端限速：5 次失败后锁定 30 秒
- 所有用户数据在插入 DOM 前经过 HTML 转义（防 XSS）
- 所有 URL 在使用前验证 http/https 协议（防 javascript: 注入）
- `js/config.js`（含密码哈希）已加入 `.gitignore`，不会提交到公开仓库

---

## 项目结构

```
├── index.html              # 前台门户主页
├── admin/
│   └── index.html          # 后台管理面板
├── js/
│   ├── main.js             # 核心逻辑（渲染、同步、管理面板）
│   ├── data.js             # 默认网站数据（KV 为空时使用）
│   ├── portal-export.js    # 导出备份数据占位（默认为空）
│   ├── config.js           # 密码哈希配置（gitignored，构建时生成）
│   └── config.example.js   # 配置文件示例
├── css/
│   └── style.css           # 全站样式（含动画、毛玻璃效果）
├── functions/
│   └── api/
│       └── data.js         # Cloudflare Pages Function（API 端点）
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 自动部署工作流
├── build.js                # 构建脚本（生成 config.js）
└── .gitignore
```

---

## 常见问题

**Q: 推送后 Actions 失败，提示找不到 CF_ADMIN_HASH？**  
A: 检查 GitHub Secrets 中是否正确添加了三个 Secret，名称区分大小写。

**Q: 后台保存提示"云端同步失败：认证过期"？**  
A: 说明 `_adminPassword`（内存中的密码）与 CF Pages 的 `ADMIN_HASH` 环境变量不匹配。重新刷新页面并用正确密码登录即可。如果是改密码后出现此问题，需按"修改密码"章节的步骤更新 GitHub Secret 并重新部署。

**Q: 首次部署后访问 /api/data 返回 null？**  
A: 这是正常的。KV 中还没有数据，页面会显示 `js/data.js` 中的默认网站。登录后台保存一次数据后 KV 就会有数据了。

**Q: KV 绑定了但 Pages Function 还是提示 503？**  
A: 绑定 KV 后需要重新部署一次才能生效。可以在 Cloudflare Dashboard 手动触发重新部署，或推送一个空 commit。

**Q: 如何绑定自定义域名？**  
A: Cloudflare Pages 项目 → Custom domains → Add custom domain，填写你的域名，按提示配置 DNS 即可。

---

## License

MIT License — 可自由使用、修改和分发，保留原始版权声明即可。
