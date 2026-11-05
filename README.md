# 拾光 · 个人生活记录站

一个用来自留生活碎片的个人站点：日记、相册、去过的地方。
基于 [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)（MIT）重建，设计层与内容模型全部重写。

## 技术栈

- Next.js 15（App Router，静态生成）+ React 19
- Tailwind CSS v4（自定义「夜梦」设计 token：墨蓝底 + 雾紫微光）
- contentlayer2：Markdown/MDX → 类型化内容
- 自托管思源宋体（`@fontsource/noto-serif-sc`），不依赖 Google Fonts

## 本地运行

```bash
npm install
npm run dev      # 开发预览 http://localhost:3000，改代码即时刷新
npm run build    # 生产构建（会顺便生成 public/feed.xml）
npm run serve    # 预览生产构建 http://localhost:3000
npm run preview  # build + serve 一条命令搞定，发布前用这个走一遍
```

## 工作台（日常运维用）

```bash
npm run studio      # 等同 npm run dev
```

然后打开 **http://localhost:3000/studio**（不要用 127.0.0.1 之外的地址）。

四个面板：

| 面板 | 能做什么 |
|---|---|
| 概览 | 日记/照片/书/行程/地点统计，最近 6 条 |
| 写日记 | 表单化 front-matter + Markdown 编辑 + 实时预览，可存草稿 |
| 照片 | 拖拽上传，自动压到长边 1600 / 质量 82，顺手填说明和地点 |
| 发布 | 列出待提交文件 → 一键 commit + push → Vercel 自动构建 |

**安全边界**

- `middleware.ts` 把 `/studio` 和 `/api/studio/*` 限制为本机与局域网 IP，线上访问一律 404
- API 层还有一道闸：`process.env.VERCEL` 存在时直接 403；用 `next start` 本地预览需显式设 `STUDIO_ALLOW=1`
- 只能写 `data/life/`、`site-data/`、`public/photos/` 三个目录，其它路径直接拒绝
- 每次覆盖前把原文件快照到 `.studio-backup/<时间戳>/`（已 gitignore），没提交也能找回
- 发布前会先 `git pull --rebase --autostash`，有冲突就停下来，不会强推

上线与环境变量、日常更新、备份排错，见 **[DEPLOY.md](DEPLOY.md)**。
改配色、文案、加新页面、加新内容类型，见 **[CUSTOMIZE.md](CUSTOMIZE.md)**。

## 写一条记录

在 `data/life/` 下新建 `YYYY-MM-DD-英文短名.mdx`：

```mdx
---
title: 降温前的最后一个晴天
date: 2026-10-28
mood: 平静            # 开心 / 温暖 / 平静 / 满足 / 低沉 / 疲惫 / 兴奋
weather: 晴 21℃
place: 苏州 · 平江路
kind: entry           # entry 日记 / note 碎片 / trip 远行 / photo 照片
tags: ['日常', '散步']
summary: 一句话摘要，会出现在列表页。
---

正文写 Markdown 即可。
```

- 文件名决定访问路径：`/life/2026-10-28-sunny-day`
- `mood` 决定列表里那个小圆点的颜色（见 `lib/life.ts` 的 `MOOD_TONE`）
- 加 `draft: true` 后生产构建不会包含它

## 放一张照片

图片丢进 `public/photos/`，文件名以日期开头即可自动进相册：

```
public/photos/2026-10-28-pingjiang-alley.jpg
```

说明文字、地点写在项目根目录的 `photos.meta.json`（按文件名匹配，可省略）：

```json
{
  "2026-10-28-pingjiang-alley": {
    "caption": "巷子里的光",
    "place": "苏州 · 平江路",
    "tags": ["街拍"]
  }
}
```

- 宽高在构建时用 `image-size` 读出来，瀑布流不会跳动，不需要手填
- 相册按文件名里的日期倒序排列
- 顶部可按**年份**或**标签**筛选（单选，切换时带淡入），计数自动统计
- 点开是灯箱：← → 翻页、Esc 关闭、点背景关闭；筛选后翻页范围跟着变成当前结果集
- 列高会自动做均衡分配（`balanceForColumns`），避免某一列特别短
- 图片走 `next/image`，首次访问时由服务端转码压缩；若要导出纯静态站需把 `images.unoptimized` 打开

## 标一个足迹

日记里写 `place: 苏州 · 平江路`，这条记录就会自动出现在足迹页（取 `·` 前第一段作为城市）。

没有写成长记录的地方，补在 `site-data/places.json` 的 `trips` 里：

```json
{ "city": "杭州", "date": "2026-05-02", "note": "西湖边上走了三个小时。" }
```

城市经纬度放在同一个文件的 `cities` 里。写了地点但没配坐标的城市，
页面顶部会提示去补，不会静默丢弃。

## 往书架上放书

编辑 `site-data/books.json`：

```json
{
  "books": [
    {
      "title": "人间草木",
      "author": "汪曾祺",
      "status": "done",        // reading 在读 / done 读完 / wish 想读
      "rating": 5,             // 1-5，只有 done 用
      "date": "2026-08-18",
      "note": "看完想在阳台种点什么。",
      "tags": ["散文", "吃"]
    },
    { "title": "斯通纳", "author": "约翰·威廉斯", "status": "wish", "note": "一直没敢开始。" }
  ]
}
```

- `status` 决定它落在哪一排架子上；`progress`（0-100）只有「在读」会显示
- **书脊高度和宽度是按书名长度算的**，所以长书名会自动变宽，不会把字截断
- 悬停会抬起来并浮出小卡片（书名/作者/评分或进度），点一下开详情看批注
- 配色从 `lib/books.ts` 的 `SPINES` 里按书名哈希取，想换色改那个数组即可

关于底图：足迹页是**自绘经纬度散点**（圆点 + 经纬网 + 时间虚线），
不加载任何地图瓦片，也不画行政区划边界，因此不依赖第三方地图服务和 key，
也和站点的纸感风格一致。若以后要真实底图，合规可用腾讯地图 / 高德 / 天地图，
需要自己去开放平台申请 key，再接入 `TMap.Map`。

## 目录

```
app/
  Main.tsx             首页（首屏 + 三个入口 + 最近三条）
  life/page.tsx        生活流时间轴
  life/[slug]/page.tsx 单条记录
  photos/page.tsx      相册墙
  places/page.tsx      足迹（散点图 + 地点列表）
  books/page.tsx       书架（书脊 + 详情）
components/
  LifeTimeline.tsx     时间轴列表
  PhotoWall.tsx        瀑布流 + 灯箱 + 筛选
  FootprintMap.tsx     自绘经纬度散点 + 标签避让
  Bookshelf.tsx        书脊书架 + 悬停卡片
  TiltCard.tsx         卡片微倾斜交互
  Ambient.tsx          跟随鼠标的背景微光
  TodayLine.tsx        首屏日期行
  Header / Footer / FooterEgg / MobileNav
data/life/             生活记录内容
site-data/places.json  城市坐标 + 手动补充的行程
site-data/books.json   书架数据
site-data/photos.meta.json  相册文字说明
public/photos/         相册图片
lib/life.ts            日期、分组、心情配色
lib/photos.ts          相册扫描与尺寸读取
lib/places.ts          足迹聚合（日记地点 + 手动行程）
lib/books.ts           书架类型与书脊计算（纯函数，可进客户端）
lib/books.server.ts    书架数据读取（只能服务端引用）
css/tailwind.css       设计系统（颜色/字体/纹理/动效）
_sample-content/       示例内容与遗留页面的归档（.gitignore 忽略，可随时整个删掉）
```

> 站点只有四个内容区：生活流 / 相册 / 足迹 / 书架。starter 自带的 blog、tags、projects、
> authors 以及它们依赖的 layouts、评论、社交图标已经整组移除，搜索索引也改成从生活流生成。

> 注意 `lib/books.ts` 与 `lib/books.server.ts` 的分工：带 `fs` 的模块一旦被客户端组件
> 引用，webpack 会直接报 `node:fs` 无法解析。凡是要在 client component 里用的常量/纯函数，
> 都必须放在不含 `node:` 依赖的文件里。

> `site-data/` 不能并进 `data/` —— contentlayer 会把该目录下所有文件当文档解析并告警。

## 页脚彩蛋

页脚那句「写于每一个普通的日子」可以连点 —— **点 5 下**会翻开一页旧记录
（有往年同月同日的记录就优先翻它，没有就随机抽一条），可以「再翻一页」继续抽。
平时没有任何提示，中断超过 2.2 秒计数会重置。

改文案 / 改次数 / 改判定规则都在 `components/FooterEgg.tsx`：
`onClick` 里的阈值 `5`、`pickMemory()` 里的同月同日逻辑。

## 改造时踩到的三个坑（已处理，改配置时注意）

1. **工程路径含单引号**（`iygnohz2's`）会让 Next 的 `robots.ts` / `sitemap.ts`
   生成代码时把路径拼进单引号字符串里，直接语法错误。
   已改成 `app/robots.txt/route.ts` 与 `app/sitemap.xml/route.ts` 两个普通 route handler，
   **不要改回 metadata 文件写法**。
2. **`next dev` 的 eval-source-map 会产出 3MB 的单 chunk**，在受限网络/代理下可能被截断，
   表现为浏览器报 `SyntaxError: Invalid or unexpected token`（页面静态内容正常、但完全没有交互）。
   生产构建是多 chunk 的，不受影响。
3. **本机不存在可用的中文衬线字体**（连 `SimSun` 都回退到雅黑），
   所以标题字体必须走自托管，别删 `app/layout.tsx` 里的 fontsource 引入。

## 待做

- 相册查看更多时按需加载（当前一次性渲染全部）
- 生活流按心情/标签筛选
