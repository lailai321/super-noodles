# Super Noodles — Project Status

**更新日期：2026-06-04**

---

## 线上地址

| 环境 | URL |
|------|-----|
| 生产 | https://supernoodlesonline.com.au |
| Vercel 项目 | vickyl-s-projects / super-noodles |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 16.2.6（App Router）|
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand 5 |
| 图标 | lucide-react |
| 数据库 | Supabase（PostgreSQL）|
| 支付 | Stripe（Live 模式，真实收款）|
| 推送通知 | Telegram Bot |
| 部署 | Vercel（Hobby Plan）|

---

## 店铺信息

- **店名**：Super Noodles – Glenmore Park
- **地址**：Kiosk 2 Glenmore Park Town Centre, 1/11 Town Terrace, Glenmore Park NSW 2745
- **电话**：(02) 4733 4782
- **营业时间**：周一休息，周二至周日 10:45am–8:30pm

---

## 设计系统

| 元素 | 值 |
|------|-----|
| 标题字体 | Rackety DEMO |
| 正文字体 | BudgePair |
| 字体文件位置 | `/public/fonts/` |
| 主色黄 | `#F3BD25` |
| Hover 深黄 | `#D9A815` |
| 背景白 | `#FFFFFF` |
| 深色文字 | `#1A1A1A` |
| 卡片背景 | `#F7F7F7` |
| Logo | `/public/logo_final.svg`（黄色，已裁切）|

---

## 已完成功能

### 前台页面

| 路由 | 功能 |
|------|------|
| `/` | 主菜单页：分类导航 + 搜索 + 菜品卡片 |
| `/checkout` | 结账页：时间选择（悉尼时区，最早+30分钟，截止20:30）+ Stripe 支付 |
| `/order/[id]` | 订单确认 / 收据页 |
| `/track` | 查询订单状态 |
| `/about` | 品牌页：Our Story + Our Locations（文字+图片双栏）|
| `/catering` | 宴会 / 大单查询页 |
| `/offers` | 优惠页（已建，内容待补）|
| `/admin` | 后台管理页（密码保护）|

### UI 组件

| 组件 | 说明 |
|------|------|
| `Navbar` | 顶部导航：桌面全展开，手机 Logo + 汉堡菜单 |
| `CategoryNav` | 分类导航：桌面 sticky 左侧栏，手机横向滚动黄色按钮 |
| `ItemCard` | 菜品卡片（含图片、名称、价格）|
| `ItemModal` | 菜品详情弹窗（垂直居中，顶部固定 + 中间滚动 + 底部固定）|
| `CartDrawer` | 购物车：桌面右侧抽屉 |
| `MobileCartBar` | 手机底部悬浮条（View Cart · N items · $XX）|
| `PromoBanner` | 促销横幅 |
| `RefundPolicy` | 退款政策（英文，显示于结账页和订单确认页）|

### API 路由

| 端点 | 功能 |
|------|------|
| `POST /api/checkout` | 创建 Stripe PaymentIntent |
| `POST /api/webhook/stripe` | Stripe Webhook：支付成功后写订单到 Supabase + 推送 Telegram |
| `GET /api/track` | 按订单号查询状态 |
| `POST /api/receipt` | 发送收据 |
| `GET /api/menu` | 返回菜单数据 |
| `POST /api/catering` | 宴会查询提交 |
| `POST /api/admin/auth` | 后台登录验证 |
| `POST /api/admin/soldout` | 标记菜品售完 |
| `POST /api/admin/override` | 手动覆盖营业状态 |
| `GET /api/setup-webhook` | 注册 Telegram Webhook |
| `GET /api/debug-env` | 调试用：显示环境变量（⚠️ 待删除）|
| `POST /api/webhook/telegram` | 接收 Telegram 消息 |

### 菜单数据

- 文件：`src/data/menu.json`
- 88 个有效菜品，9 个分类
- 已修复乱码（全角括号 / 全角逗号）

---

## 环境变量

> `.env.local` 用于本地开发，生产环境变量在 Vercel Dashboard 设置。

```env
# Stripe（⚠️ 生产环境应使用 Live 密钥）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxjqgtrftggjtvwtxxab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=8424288241

# Admin
ADMIN_PASSWORD=...

# Store
NEXT_PUBLIC_STORE_NAME=Super Noodles
NEXT_PUBLIC_STORE_ADDRESS=Kiosk 2 Glenmore Park Town Centre, ...
NEXT_PUBLIC_STORE_PHONE=(02) 4733 4782
NEXT_PUBLIC_APP_URL=https://supernoodlesonline.com.au
```

**注意**：本地 `.env.local` 当前的 Stripe 密钥是 **test 模式**（`pk_test_` / `sk_test_`），Vercel 生产环境已切换为 Live 密钥。

---

## 待办事项

| 优先级 | 任务 |
|--------|------|
| 🔴 高 | 删除 `/api/debug-env` 端点（暴露环境变量，安全隐患）|
| 🟡 中 | 手机端分类导航栏移到搜索框下方 |
| 🟡 中 | About 页补全分店 2、3 的地址信息 |
| 🟢 低 | Banner 换成真实餐厅照片 |
| 🟢 低 | `/offers` 页填充实际优惠内容 |

---

## 本地开发

```bash
npm run dev     # 启动开发服务器 http://localhost:3000
npm run build   # 生产构建
npm run start   # 本地运行生产构建
```
