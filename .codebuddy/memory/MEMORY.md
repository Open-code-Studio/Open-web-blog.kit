# MEMORY.md

## 项目概要
- **Open-web-blog.kit**: 使用 Material Design 3 风格的静态博客站点，基于 JMCL 项目架构。
- 路径: `/Users/cangcang/Documents/code/Open-web-blog.kit/`

## 架构约定
- 所有文章使用 Markdown 编写，存储在 `page/` 目录。
- 博客配置由 `main/config.json` 驱动，添加新文章在 nav 数组中新增条目（含 tags/excerpt/date）。
- 主题 localStorage key: `owb-theme`

## 文件结构
```
├── index.html              (引导页)
├── main/
│   ├── index.html          (首页: Hero + 文章卡片 + 标签筛选, 无侧边栏)
│   ├── page.html           (文章阅读: 侧边栏文章列表 + MD渲染 + TOC)
│   ├── link.html           (友链页: 链接卡片网格)
│   ├── about.html          (关于页: 技术栈/设计理念)
│   ├── css/
│   │   ├── theme.css, layout.css, components.css, markdown.css
│   │   ├── home.css        (Hero、文章卡片、主题卡片、标签pills)
│   │   └── nav.css         (圆角浮动导航栏, pill形, 毛玻璃效果)
│   ├── js/
│   │   ├── app.js          (首页逻辑: 文章加载 + 标签筛选)
│   │   ├── page.js         (文章页逻辑: 侧边栏 + hash路由 + MD渲染)
│   │   └── theme.js        (主题切换, 供 link/about 页面共用)
│   └── config.json         (站点配置 + 文章列表)
└── page/
    └── hi!.md              (第一篇博客文章)
```

## 关键设计决策
- **浮动导航栏**: `position:fixed; top:16px; left:50%; transform:translateX(-50%)` 的圆角pill形，独立图层，带毛玻璃效果。
- **侧边栏仅在 page.html 显示**: page.html 使用 `main-content`(带margin-left) + sidebar；index/link/about 使用 `main-content--full`（无margin）。
- **文章卡片点击跳转**: 首页卡片链接 `page.html#/{route}`，page.html 通过 hash 路由加载文章。
- **标签筛选**: 首页从 config.json 的 tags 字段自动生成筛选按钮，全客户端过滤。

## 关键依赖
- marked.js (Markdown 解析, CDN)
- highlight.js (代码高亮, CDN)
- Noto Sans SC + JetBrains Mono (字体, fonts.loli.net CDN)
