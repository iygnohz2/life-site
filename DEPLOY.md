# 拾光 · 上线与日常运维

## 零、先选路线

| 方案 | 上线耗时 | 国内访问 | 成本 | 适合 |
|---|---|---|---|---|
| **A. Vercel** | ~10 分钟 | 一般（自定义域名后可用，但不稳定） | 免费 | 先上线看看、给朋友看 |
| **B. 国内轻量服务器** | 1–3 周（卡在备案）+ 1 小时配置 | 快且稳 | 服务器 ~¥100/年 + 域名 ~¥50/年 | 长期自用、要给国内的人看 |
| C. Cloudflare Pages | ~30 分钟 | 较差（免费域名基本不可用） | 免费 | 不推荐 |

**建议：先用 A 上线跑起来，确认内容和样式都满意；如果之后发现国内打开慢，再迁到 B。**
两边都用同一个 GitHub 仓库，迁移时不用改代码。

---

## 一、方案 A：Vercel

### 1. 代码推到 GitHub

如果还没有仓库：

```powershell
cd "E:\Ethan‘s Work\个人\iygnohz2's DreamLand\life-site"
git init
git add .
git commit -m "init"
git remote add origin https://github.com/<你的账号>/shiguang.git
git push -u origin main
```

> `node_modules`、`.next`、`shot-*.png` 已经在 `.gitignore` 里，不会被提交。

### 2. 导入

1. 打开 https://vercel.com ，用 GitHub 登录
2. **Add New → Project → Import** 选刚才的仓库
3. Framework 会自动识别为 Next.js，构建命令不用改
4. 展开 **Environment Variables**，加一条：
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://你的域名`（先用 Vercel 给的 `xxx.vercel.app` 也行）
5. **Deploy**，一两分钟出结果

### 3. 绑域名（可选但建议）

Vercel 项目 → Settings → Domains → 添加域名，按提示到域名商加一条 CNAME。
DNS 生效后回到上面第 4 步把 `NEXT_PUBLIC_SITE_URL` 改成正式域名，**重新 Deploy 一次**（环境变量改动不会自动重建）。

> ⚠️ 用国外平台 + 国内域名，理论上不需要备案；但访问速度看线路，晚上可能很慢。这是选 B 的唯一理由。

---

## 二、方案 B：国内轻量服务器

### 1. 前置（这三件事最花时间，可以并行）

- **买服务器**：阿里云/腾讯云「轻量应用服务器」，2 核 2G、系统选 **Ubuntu 22.04** 或 Debian 12
- **买域名**：任意域名商，`.com` / `.cn` 都行
- **ICP 备案**：在国内服务器上放网站，域名必须备案（个人主体，免费，1–3 周）
  - 备案期间网站不能对外开，可以先在本地继续写内容

### 2. 服务器初始化

```bash
# 装 Node 22（NodeSource）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# 拉代码
cd /var/www && sudo git clone https://github.com/<你的账号>/shiguang.git
cd shiguang && sudo npm ci
```

### 3. 配置环境变量并构建

```bash
sudo cp .env.example .env
sudo nano .env      # 把 NEXT_PUBLIC_SITE_URL 改成 https://你的域名
sudo npm run build
```

### 4. 用 pm2 常驻

```bash
sudo npm i -g pm2
sudo cp deploy/ecosystem.config.cjs ./ecosystem.config.cjs
sudo pm2 start ecosystem.config.cjs
sudo pm2 save && sudo pm2 startup    # 开机自启
```

### 5. Nginx 反向代理 + HTTPS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/shiguang
sudo nano /etc/nginx/sites-available/shiguang   # 改 server_name
sudo ln -s /etc/nginx/sites-available/shiguang /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 免费证书，自动续期
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

---

## 三、日常运维（重点）

### 写一篇日记

**方式一：GitHub 网页（不用装任何东西，手机也能写）**

1. 仓库里进 `data/life/` → **Add file → Create new file**
2. 文件名 `2026-11-05-xxx.mdx`
3. 粘贴 front-matter（照抄一篇现成的改），正文写 Markdown
4. **Commit changes** → 自动触发部署，1–2 分钟后线上就是新的

**方式二：本地写，推上去**

```powershell
cd "E:\Ethan‘s Work\个人\iygnohz2's DreamLand\life-site"
npm run dev                  # 先本地看效果
git add . && git commit -m "add: 今天的一篇"
git push
```

### 加照片

图片是二进制，网页上传也行：仓库 `public/photos/` → **Add file → Upload files** → 拖进去。
文件名规则 `YYYY-MM-DD-短名.jpg`，说明文字在 `site-data/photos.meta.json`。

> GitHub 网页上传单文件上限 25 MB，单次提交建议不超过 20 张，否则仓库会越来越重。
> 照片建议先压到长边 1600px 以内再传。

### 改站点信息

`data/siteMetadata.js`（标题、作者、简介）；`data/headerNavLinks.ts`（导航）。
改完 commit 即可。

### 备份

- **代码和文字**：GitHub 本身就是完整历史，误删可以回滚到任意一次提交
- **照片**：同样在仓库里；建议每半年在本地留一份完整 `git clone`
- **服务器上的东西**：只有 `.env` 不在仓库里，记在密码管理器即可

### 升级依赖（半年到一年一次，可以不急）

```powershell
npm outdated          # 看哪些有新版
npm update            # 小版本
npm run build         # 必须能构建通过再推
```

### 出问题了怎么看

| 情况 | 排查 |
|---|---|
| Vercel 部署失败 | 点进那次 Deployment 看 Build Logs，通常是某个 md 的 front-matter 写错 |
| 国内服务器打不开 | `pm2 status` 看进程是否活着；`pm2 logs` 看报错；`sudo nginx -t` 看配置 |
| 页面样式错乱 | 多半是 `NEXT_PUBLIC_SITE_URL` 没配或配错，重新构建 |
| 改了内容但线上没变 | 看 Actions/Deploy 是否成功；浏览器强刷（Ctrl+F5） |

---

## 四、上线前 Checklist

- [ ] `NEXT_PUBLIC_SITE_URL` 已配置为真实域名
- [ ] `data/siteMetadata.js` 里 title / author / description 改成自己的
- [x] 示例内容已清空（日记、照片、书籍、行程都归档到 `_sample-content/`，该目录不进 git）
- [x] starter 遗留页（blog / tags / projects / faq）已移除
- [ ] `site-data/places.json` 的 `cities` **保留**（城市坐标表），`trips` 按需补
- [ ] 本地 `npm run preview` 走一遍，手机也打开看看
- [ ] 访问 `/sitemap.xml`、`/robots.txt` 两个地址，链接是正式域名
- [ ] 确认没有不想公开的内容（日记里写了真名、地址、门牌号之类）

## 五、成本

| 项 | 方案 A | 方案 B |
|---|---|---|
| 托管 | 0 | ~¥100/年（轻量 2C2G） |
| 域名 | ~¥50/年 | ~¥50/年 |
| HTTPS | 自带 | 免费（certbot） |
| 备案 | 不需要 | 免费，1–3 周 |
