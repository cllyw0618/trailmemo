# TrailMemo 山野手账

TrailMemo 是一个面向旅行与徒步爱好者的 3D 电子手账 Web 应用。项目把“路线探索、手账记录、像素旅人成长、云端数据保存”结合在一起，让用户像玩探索小游戏一样记录自己的徒步记忆。

在线预览：[https://trailmemo.vercel.app/](https://trailmemo.vercel.app/)

---

## 一、项目定位

传统旅行记录通常只是上传照片、写文字，缺少持续探索感。TrailMemo 的目标是把徒步记录做成一个更有故事感的成长体验：

1. 用户进入网站后，可以在真实纹理的 3D 地球上查看国内外经典徒步路线。
2. 点击路线后，可以创建电子手账，上传照片、填写天气、心情和文字记忆。
3. 保存记录后，对应路线会被点亮，并进入个人记忆档案。
4. 随着点亮路线数量增加，像素旅人会升级，逐步解锁帽子、上衣、背包、鞋子等装备。
5. 用户数据通过 Supabase 保存，支持注册登录和游客访问。
6. 社区营地：用户可以将手账分享到社区，其他旅人可以查看和评论。

项目重点不是做强路线规划，而是做“沉浸式徒步记录”和“成长型电子手账”。

---

## 二、技术栈

| 模块 | 技术 |
|---|---|
| 前端框架 | Vue 3 + Composition API |
| 构建工具 | Vite |
| 路由管理 | Vue Router |
| 状态管理 | Pinia |
| 3D 地图 | Three.js |
| 角色绘制 | Canvas 像素绘制 |
| 后端服务 | Supabase Auth + Supabase Database |
| 数据库 | Supabase PostgreSQL |
| 部署平台 | Vercel |

---

## 三、核心功能

### 1. 启动与认证流程

用户从启动页点击“唤醒山野记忆”后进入认证页面，可以选择：

- 邮箱注册
- 邮箱登录
- 游客访问

游客访问使用 Supabase Anonymous Sign In 创建真实匿名用户，系统会获得一个 UUID，后续手账、路线点亮、角色数据都通过这个 user_id 关联。

### 2. 3D 徒步地图

地图页使用 Three.js 渲染 3D 地球，支持旋转、缩放和路线点点击。路线点来自项目内置的国内外经典徒步路线数据，每条路线包含：

- 路线名称
- 经纬度
- 地区与国家
- 难度、距离、用时
- 路线故事和标签

用户点击地球上的路线点后，可以进入手账创建流程。

### 3. 电子手账系统

手账编辑页支持：

- 选择路线
- 输入标题、天气、心情、文字记忆
- 上传 1 到 4 张照片
- 选择不同照片数量对应的排版模板
- 实时预览拼贴手账效果
- 保存后自动点亮路线

手账卡片由 `CollageCard.vue` 渲染，照片会以电子手账、胶片、拼贴、手写感的方式展示。

### 4. 记忆档案与管理

“背包”页面用于查看用户保存过的记录，包括：

- 当前等级与探索统计
- 已探索区域
- 成就徽章
- 所有手账卡片
- 删除手账记录

这一部分体现用户长期积累的旅行记忆。

### 5. 成长装备系统

新增的“成长”页面用于展示像素旅人的成长路线，包含：

- Lv.1 山野新人
- Lv.3 草甸行者
- Lv.5 峡谷探索者
- Lv.8 雪山旅人
- Lv.12 远方收藏家
- Lv.16+ 地球漫游者

每个等级展示不同角色外观和解锁装备。装备分为帽子、上衣、背包、鞋子等类别，方便答辩时直观看到角色成长变化。

### 6. 社区营地

“营地”页面是旅人们的公共交流空间：

- 查看所有旅人分享的山野手账
- 对手账进行评论互动
- 在“背包”页面将已保存的手账一键分享到社区
- 管理自己的分享帖和评论

社区数据同样通过 Supabase 存储，社区帖子表（community_posts）和评论表（community_comments）均启用 RLS 行级安全策略，确保数据安全。

---

## 四、页面与组件结构

```text
trailmemo/
├─ src/
│  ├─ App.vue                     # 根组件，包含底部五项导航
│  ├─ main.js                     # 应用入口，初始化 Pinia、Router 和认证状态
│  ├─ router/index.js             # 路由配置
│  ├─ views/
│  │  ├─ LoadingView.vue          # 启动页
│  │  ├─ AuthView.vue             # 注册、登录、游客访问页
│  │  ├─ MapView.vue              # 3D 地图探索页
│  │  ├─ JournalEditorView.vue    # 手账创建页
│  │  ├─ GrowthView.vue           # 成长装备系统页
│  │  ├─ MemoryView.vue           # 记忆背包页
│  │  └─ CommunityView.vue        # 社区营地页
│  ├─ components/
│  │  ├─ TrailMap3D.vue           # Three.js 3D 地球组件
│  │  ├─ CollageCard.vue          # 手账拼贴卡片组件
│  │  ├─ PixelTraveler.vue        # Canvas 像素旅人绘制组件
│  │  └─ GrowthSystemPanel.vue    # 成长系统展示面板
│  ├─ stores/
│  │  ├─ authStore.js             # Supabase 认证状态
│  │  ├─ memoryStore.js           # 路线、手账、点亮数据
│  │  ├─ travelerStore.js         # 像素旅人形象数据
│  │  └─ communityStore.js        # 社区帖子与评论数据
│  ├─ data/
│  │  ├─ trails.js                # 徒步路线数据
│  │  └─ achievements.js          # 成就规则
│  ├─ lib/supabase.js             # Supabase 客户端配置
│  └─ styles/global.css           # 全局样式与底部导航样式
├─ docs/
│  ├─ supabase-schema.sql         # Supabase 数据库建表与 RLS 策略
│  └─ project-documentation.md    # 项目技术说明文档
├─ README.md
├─ DEFENSE_SCRIPT.md              # 三分钟答辩稿
├─ PROJECT_DEFENSE.md             # 项目运行原理与老师追问准备
├─ vercel.json                    # Vercel SPA 部署配置
└─ package.json
```

---

## 五、数据库设计

项目使用 Supabase PostgreSQL。建表脚本位于：

```text
docs/supabase-schema.sql
```

主要数据表：

| 表名 | 作用 | 关键字段 |
|---|---|---|
| profiles | 用户档案 | id, username, gender, birthday, level, experience |
| characters | 像素角色 | user_id, character_type, equipment, level |
| unlocked_trails | 已点亮路线 | user_id, trail_id, created_at |
| journals | 手账记录 | id, user_id, trail_id, title, mood, weather, text, images, template |
| hikes | 徒步记录扩展表 | id, user_id, distance, duration, location |
| community_posts | 社区分享帖 | id, user_id, title, text, images, template, trail_id, author_name, author_level |
| community_comments | 社区评论 | id, post_id, user_id, author_name, text |

所有业务数据都通过 `user_id` 与 Supabase Auth 用户关联，并启用 RLS 行级安全策略，保证用户只能访问自己的数据。

---

## 六、接口与数据交互

项目没有单独部署传统 Node 后端，而是使用 Supabase 提供的标准接口：

| 功能 | 调用方式 |
|---|---|
| 注册 | `supabase.auth.signUp()` |
| 登录 | `supabase.auth.signInWithPassword()` |
| 游客访问 | `supabase.auth.signInAnonymously()` |
| 获取用户档案 | `supabase.from('profiles').select()` |
| 保存手账 | `supabase.from('journals').insert()` |
| 读取手账 | `supabase.from('journals').select()` |
| 点亮路线 | `supabase.from('unlocked_trails').upsert()` |
| 删除手账 | `supabase.from('journals').delete()` |
| 社区帖子列表 | `supabase.from('community_posts').select()` |
| 分享到社区 | `supabase.from('community_posts').insert()` |
| 社区评论 | `supabase.from('community_comments').select() / .insert() / .delete()` |

这些接口由 Pinia store 统一封装，页面组件不直接处理复杂的数据库逻辑。

---

## 七、安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example`，创建 `.env.local`：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

### 3. 初始化数据库

在 Supabase SQL Editor 中执行：

```text
docs/supabase-schema.sql
```

### 4. 本地启动

```bash
npm run dev
```

访问：

```text
http://localhost:5173
```

### 5. 生产构建

```bash
npm run build
```

---

## 八、部署说明

项目部署在 Vercel。

`vercel.json` 已配置 Vite 构建与 SPA 路由回退：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

部署步骤：

1. 将代码推送到 GitHub 仓库。
2. 在 Vercel 导入该仓库。
3. Framework 选择 Vite。
4. 添加环境变量 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
5. 点击 Deploy。

---

## 九、评分项对照

| 评分项 | 项目对应内容 |
|---|---|
| 需求分析与项目价值 | 面向徒步爱好者，解决旅行记忆零散、记录缺少沉浸感的问题 |
| 前端功能实现 | 多页面 Vue 应用，包含地图、认证、手账、成长、背包等核心页面 |
| 前端界面与用户体验 | 梦幻清新风格，3D 地球、底部导航、电子手账、像素旅人成长 |
| 后端接口 | 使用 Supabase Auth 和 Supabase Database REST 接口完成认证与数据交互 |
| 数据库 | 使用 PostgreSQL，包含 profiles、characters、journals、unlocked_trails 等表 |
| 部署上线 | 使用 Vercel 部署，支持公网访问 |
| 项目文档 | README、技术说明、数据库脚本、答辩稿均已提供 |
| 演示与答辩 | 可按“启动页 -> 登录/游客 -> 地图 -> 写手账 -> 成长 -> 背包”流程演示 |

---

## 十、答辩演示建议

建议演示顺序：

1. 打开项目首页，点击“唤醒山野记忆”。
2. 进入认证页，选择游客访问或邮箱登录。
3. 展示 3D 地球地图，旋转和缩放地球，点击路线点。
4. 进入手账页，填写文字、选择模板、上传照片并保存。
5. 展示路线点亮反馈。
6. 打开“成长”页面，展示等级和装备变化。
7. 打开“背包”页面，展示已保存手账，点击「分享到营地」。
8. 打开“营地”页面，查看社区分享帖和评论功能。

---

## 十一、项目亮点

- 真实 3D 地球纹理与路线标记结合，视觉表现比普通列表更有探索感。
- 使用 Canvas 绘制像素旅人，等级变化会带来装备变化。
- 手账模板支持 1 到 4 张照片，用户输入内容会参与排版。
- Supabase 同时承担认证、数据库和权限控制，减少传统后端部署成本。
- 项目已部署到 Vercel，适合作为课程答辩展示。
