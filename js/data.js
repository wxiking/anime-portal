/**
 * 二次元动漫毛玻璃个人门户 - 网站集群数据配置文件
 * 
 * 后台系统将直接读取本地 LocalStorage 或此数组。
 * 导出功能也会生成此格式的数据以供覆盖。
 */

const initialWebsitesData = [
  {
    id: 1,
    name: "STARGAZER BLOG",
    url: "https://blog.example.com",
    description: "记录星空碎屑与唯美代码的前端开发博客，关于极简美学与设计思考。",
    detailedDescription: "Stargazer Blog 是一个以二次元极简星夜为核心美学的个人技术博客。主要用于记录全栈开发心得、CSS高级唯美交互动效，以及个人对极简设计系统的深度思考。致力于将冰冷的代码谱写成唯美的星之诗篇。",
    category: "blog",
    categoryName: "技术博客",
    icon: "book-open", // 对应 Lucide 图标
    tags: ["React", "Gatsby", "Vite", "Sakura CSS"],
    status: "online",
    statusText: "运行中",
    bgGradient: "linear-gradient(135deg, rgba(200, 182, 255, 0.25) 0%, rgba(255, 179, 198, 0.25) 100%)",
    features: [
      "全站二次元磨砂玻璃设计，首屏极致流畅加载",
      "自建 Markdown 双栏解析器，支持 LaTeX 与草稿备份",
      "集成落樱与闪烁繁星特效，支持陀螺仪背景微移动",
      "基于 Cloudflare Pages 部署，静态边缘零成本加速"
    ]
  },
  {
    id: 2,
    name: "CELESTIAL CODE",
    url: "https://github.com",
    description: "汇聚奇思妙想开源项目的个人宇宙代码仓库，追逐极光与光子。",
    detailedDescription: "Celestial Code 是个人的开源项目集群仓库。这里汇集了关于 WebAssembly 本地音频处理、WebGL 3D 渲染库、轻量级前端粒子系统以及各种有趣的独立开发脚手架项目。所有作品完全开源，欢迎共同探索代码宇宙的边界。",
    category: "code",
    categoryName: "开源仓库",
    icon: "code",
    tags: ["WebAssembly", "WebGL", "TypeScript", "Node.js"],
    status: "online",
    statusText: "运行中",
    bgGradient: "linear-gradient(135deg, rgba(179, 229, 252, 0.25) 0%, rgba(200, 182, 255, 0.25) 100%)",
    features: [
      "20+ 独立开源小工具，提供一键 CDN 引入模板",
      "高性能 WebGL 粒子模拟器，支持 10万+ 粒子在网页流畅运行",
      "规范化的 CI/CD 自动化构建流，多包依赖无缝发布",
      "详尽的双语 Wiki 与设计原则白皮书"
    ]
  },
  {
    id: 3,
    name: "ART GALLERY",
    url: "https://gallery.example.com",
    description: "收集并展示个人原创 3D 像素画与二次元动漫插图的数字美术馆。",
    detailedDescription: "Art Gallery 是个人的数字美术画廊。使用 Three.js 与 Blender 构建了一个可以在三维空间中自由走动与互动的像素画廊。收录了个人设计的所有二次元场景原画、角色立绘以及低模 3D 像素建模，带您踏入唯美的幻想视界。",
    category: "art",
    categoryName: "艺术空间",
    icon: "palette",
    tags: ["Three.js", "Blender", "GSAP", "Pixel Art"],
    status: "beta",
    statusText: "公测中",
    bgGradient: "linear-gradient(135deg, rgba(255, 202, 212, 0.25) 0%, rgba(255, 230, 240, 0.25) 100%)",
    features: [
      "Three.js 驱动的 3D 全景交互画展体验",
      "支持手势旋转、放大及三维第一人称漫游视角",
      "高保真无损画质导览，支持一键保存唯美壁纸",
      "适配移动端陀螺仪，倾斜手机即可改变画面视差"
    ]
  },
  {
    id: 4,
    name: "PIXEL WORLDS",
    url: "https://game.example.com",
    description: "完全运行在网页端的轻量级复古二次元像素风 RPG 冒险小游戏。",
    detailedDescription: "Pixel Worlds 是一款基于 HTML5 Canvas 与 Web Audio API 独立制作的复古像素风格冒险游戏。玩家可以在磨砂浮块界面上直接控制角色在唯美的幻想大陆进行冒险，包含动态天气系统、昼夜更替动效和丰富的隐藏彩蛋。",
    category: "game",
    categoryName: "游戏世界",
    icon: "gamepad-2",
    tags: ["Canvas API", "Web Audio", "Vanilla JS", "A* Pathfind"],
    status: "maintain",
    statusText: "维护中",
    bgGradient: "linear-gradient(135deg, rgba(255, 202, 212, 0.25) 0%, rgba(179, 229, 252, 0.25) 100%)",
    features: [
      "无外部庞大引擎，纯前端 Canvas API 编写，大小仅 2.4MB",
      "内置动态音频生成合成器，享受 8-Bit 复古音效与悠扬背景乐",
      "支持实时本地存档（LocalStorage）与在线云端备份同步",
      "全触摸屏手势按键映射，手机电脑端操控体验同样丝滑"
    ]
  },
  {
    id: 5,
    name: "DREAM JOURNAL",
    url: "https://diary.example.com",
    description: "记录生活琐碎日常与白日幻想，带优雅禅意的沉浸式写作看板。",
    detailedDescription: "Dream Journal 是个人的电子日记本。在这里我记录了日常的生活琐碎、新奇的脑洞幻想以及各种旅行日记。支持添加二次元心情插图与背景音效，让书写成为一种在悠扬星空下与自我深切对话的心灵礼仪。",
    category: "blog",
    categoryName: "技术博客",
    icon: "book",
    tags: ["Vue3", "IndexedDB", "Web Crypto", "Zen Mode"],
    status: "online",
    statusText: "运行中",
    bgGradient: "linear-gradient(135deg, rgba(200, 182, 255, 0.25) 0%, rgba(255, 202, 212, 0.25) 100%)",
    features: [
      "禅意沉浸式无干扰全屏写作界面，仿打字机音效反馈",
      "采用 Web Crypto API，本地文档内容完全加密后存储",
      "内置天气心情同步挂件，自动记录写作时的本地天气",
      "支持一键导出为带精美排版的 PDF 或轻量 Markdown 包"
    ]
  },
  {
    id: 6,
    name: "RESOURCES BOX",
    url: "https://box.example.com",
    description: "聚合全网最实用的二次元免版权插画、设计字体与开发神器的资源库。",
    detailedDescription: "Resources Box 是个人长期收集整理的宝藏库。涵盖了二次元免版权插画图库、极具个性的日系手写字体、免费商用音效、以及各种独立开发不可或缺的优质 API 和框架，每个资源均经过双重人工体验测试并打上推荐星级。",
    category: "code",
    categoryName: "开源仓库",
    icon: "folder",
    tags: ["HTML5", "CSS Grid", "Dynamic Search", "JSON DB"],
    status: "coming",
    statusText: "筹备中",
    bgGradient: "linear-gradient(135deg, rgba(179, 229, 252, 0.25) 0%, rgba(255, 230, 240, 0.25) 100%)",
    features: [
      "精心整理的 500+ 精品链接，涵盖设计、音效、API 等多领域",
      "支持多标签精准组合过滤，毫秒级得出搜索结果",
      "每日自动脚本检测链接有效性，红绿灯反馈网站健康状态",
      "开放用户推荐提交面板，支持在线留言和友情链接申请"
    ]
  }
];
