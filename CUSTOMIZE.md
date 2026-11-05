# 装修手册

改完存盘 → `git add . && git commit -m "改了什么" && git push` → Vercel 自动重新部署。
本地想先看效果就跑 `npm run dev`。

---

## 一、五分钟换个风格

**只改颜色**（推荐先动这一处）→ `css/tailwind.css` 顶部的 `@theme`：

| 变量 | 管什么 | 现在 |
|---|---|---|
| `--color-paper` | 页面底色 | 晨雾灰紫 `#f3f2f9`（暗色 `#080a12`） |
| `--color-surface` | 卡片/弹层底色 | `#fffdf8` |
| `--color-ink` | 主文字 | `#1c1a17` |
| `--color-ink-2` | 次级文字 | `#6d6559` |
| `--color-ink-3` | 弱提示、日期 | `#a2988a` |
| `--color-line` | 分割线、边框 | `#e2dbce` |
| `--color-dream-500` | **主强调色**（链接、圆点、按钮） | 雾紫 `#8b71c6`（暗色 `#a68fdc`） |
| `--color-mist-500` | 次强调（心情、标签） | 雾青 `#6a9593` |

暗色模式在下面 `html.dark { ... }` 里，同样六个变量各改一遍。
改 `--color-dream-*` 时建议整条色阶一起换，否则 hover、边框、浅底会打架。
暗色模式在 `html.dark` 里单独覆盖了 300~600 四档（暗底上要提亮），改主色记得两处一起改。
背景那三层光雾由 `:root` 的 `--glow-a/b/c` 控制，`Ambient.tsx` 里的两团漂移雾也在同一处调。

**换字体** → 同一个文件的 `--font-serif`（标题/书名/日期用的衬线体）和 `--font-sans`。
思源宋体由 `app/layout.tsx` 里的 `@fontsource/noto-serif-sc` 引入，换字体要连 npm 包一起换。

**圆角** → `--radius-card`（默认 4px，改成 0 就是全直角）。

---

## 二、改文案

| 想改什么 | 文件 |
|---|---|
| 站点标题 / 作者 / 简介 / 域名 | `data/siteMetadata.js` |
| 顶部导航项与顺序 | `data/headerNavLinks.ts` |
| 首页大标题那几句话 | `app/Main.tsx` |
| 首页四个入口的标题和描述 | `app/Main.tsx` 里的 `entries` 数组 |
| 各页标题下的那句导语 | `app/*/page.tsx` 里 `PageHeader` 的 `desc` |
| 页脚那句话 + 彩蛋触发文案 | `components/Footer.tsx`、`components/FooterEgg.tsx` |
| 关于页正文 | `app/about/page.tsx` |

---

## 三、加内容（不进代码）

| 类型 | 位置 | 规则 |
|---|---|---|
| 日记 | `data/life/YYYY-MM-DD-短名.mdx` | front-matter 见下 |
| 照片 | `public/photos/YYYY-MM-DD-短名.jpg` | 说明文字写到 `site-data/photos.meta.json` |
| 书 | `site-data/books.json` | `status` 决定放哪层架子 |
| 地点坐标 | `site-data/places.json` 的 `cities` | 写日记填了 `place` 但没坐标时会提示 |
| 手动行程 | `site-data/places.json` 的 `trips` | 没写成长记录的地方 |

日记 front-matter 模板：

```mdx
---
title: 标题
date: 2026-11-05
mood: 平静          # 决定时间轴圆点颜色
weather: 晴
place: 苏州 · 平江路 # 会自动进足迹页
summary: 一句话摘要
tags: ['日常']
---

正文，正常写 Markdown。
```

---

## 四、加一个新区块（比如「听歌」页）

1. 建 `app/music/page.tsx`（照抄 `app/books/page.tsx` 的结构）
2. 数据放 `site-data/music.json`，读文件的函数照抄 `lib/books.server.ts`（服务端）和
   `lib/books.ts`（纯函数，客户端可用）的拆法
3. `data/headerNavLinks.ts` 加一行导航
4. `app/Main.tsx` 的 `entries` 加一个入口
5. `app/sitemap.xml/route.ts` 的 `staticRoutes` 加上 `'music'`

⚠️ 两条铁律：
- **带 `node:fs` 的模块不能被 client component 引用**，否则构建报 `UnhandledSchemeError: node:fs`
- **JSX 里不要用全角空格 `　`**，ESLint 的 `no-irregular-whitespace` 会拦，用 `ml-3` 之类代替

---

## 五、改完怎么验证

```powershell
npm run dev       # 边改边看，热更新
npm run preview   # 发布前跑一遍：真实构建 + 生产模式预览
```

`npm run preview` 能发现 dev 模式下看不出来的问题（图片压缩、静态生成、RSS、字体子集）。

---

## 六、想退回上一版

```powershell
git log --oneline          # 找到目标提交号
git revert <提交号>        # 安全回滚（保留历史）
git push
```

不要用 `git reset --hard` 之后强推，会把历史搞乱。
