# TrailMemo 项目技术说明文档

本文档用于期末项目检查与答辩说明，按照“需求分析、前端功能、界面体验、后端接口、数据库、部署上线、项目文档、演示答辩”等评分项整理。

---

## 1. 需求分析与项目价值

### 1.1 项目背景

旅行和徒步记录常见的问题是：照片分散在相册中，文字记录分散在社交平台或备忘录中，用户很难持续看到自己的探索成长。普通记录工具更偏“存储”，缺少沉浸式体验和持续使用动力。

TrailMemo 以徒步爱好者为目标用户，将真实徒步路线、电子手账和角色成长系统结合起来，让记录过程更像一场探索游戏。

### 1.2 用户需求

目标用户主要有三类需求：

1. 想在地图上直观看到自己去过或想去的徒步路线。
2. 想把旅行照片和文字整理成更有审美的电子手账。
3. 想通过点亮路线、角色升级、装备解锁获得持续记录的动力。

### 1.3 项目价值

项目不是单纯做路线规划，而是面向“旅行记忆记录”场景，强调体验感和长期积累：

- 对用户：把零散旅行照片变成有故事感的记忆档案。
- 对课程：综合展示 Vue 组件化、路由、状态管理、前后端数据交互、数据库设计和部署上线能力。

---

## 2. 前端功能实现

项目基于 Vue 3 + Vite 构建，是一个多页面单页应用。主要页面如下：

| 页面 | 路由 | 功能 |
|---|---|---|
| 启动页 | `/` | 展示项目主题，点击按钮进入认证页 |
| 认证页 | `/auth` | 邮箱注册、邮箱登录、游客访问 |
| 地图页 | `/map` | 3D 地球、徒步路线标记、路线选择 |
| 手账页 | `/journal/new` | 创建手账、上传照片、选择模板、保存记录 |
| 成长页 | `/growth` | 展示像素旅人等级和装备解锁 |
| 背包页 | `/memory` | 展示统计、成就、已点亮地点、手账列表和删除管理 |

### 2.1 组件数量与职责

项目核心组件超过 10 个，具有较清晰的职责划分：

| 文件 | 作用 |
|---|---|
| `App.vue` | 根组件，负责全局导航和页面出口 |
| `TrailMap3D.vue` | Three.js 3D 地球渲染和路线点击 |
| `PixelTraveler.vue` | Canvas 绘制像素旅人 |
| `GrowthSystemPanel.vue` | 成长系统、等级卡、装备展示 |
| `CollageCard.vue` | 电子手账卡片排版 |
| `LoadingView.vue` | 项目启动页 |
| `AuthView.vue` | 注册、登录、游客访问流程 |
| `MapView.vue` | 地图探索页面 |
| `JournalEditorView.vue` | 手账创建页面 |
| `GrowthView.vue` | 成长装备页面 |
| `MemoryView.vue` | 背包与记忆档案页面 |
| `TrailDetailView.vue` | 路线详情页面 |

### 2.2 状态管理

使用 Pinia 管理跨页面共享数据：

- `authStore.js`：管理 Supabase 用户、session、profile、游客状态。
- `memoryStore.js`：管理路线数据、已点亮路线、手账列表、成长等级和统计。
- `travelerStore.js`：管理像素旅人的性别、身份和装备状态。

---

## 3. 前端界面与用户体验

### 3.1 视觉风格

整体采用清新、梦幻、轻手账风格：

- 蓝绿色与米白色为主色。
- 使用柔和阴影、毛玻璃卡片和圆角设计。
- 3D 地球增强探索感。
- 电子手账使用拼贴、胶片、纸张质感和手写字体氛围。
- 像素旅人成长页使用等级卡片和装备图标，方便用户直观看到成长变化。

### 3.2 交互流程

核心流程如下：

```text
启动页
  -> 认证页
  -> 地图探索
  -> 点击路线
  -> 创建手账
  -> 保存记录
  -> 点亮路线
  -> 查看成长装备
  -> 查看背包记忆
```

### 3.3 响应式设计

页面样式使用 `clamp()`、弹性布局、Grid 布局和媒体查询，适配桌面端与移动端。底部导航固定展示，方便用户在核心页面间切换。

---

## 4. 后端接口设计

项目使用 Supabase 作为后端服务，因此没有单独维护传统 Express/Koa 后端。后端能力由 Supabase Auth、PostgreSQL 和 REST 接口提供。

### 4.1 认证接口

| 功能 | Supabase 方法 |
|---|---|
| 邮箱注册 | `supabase.auth.signUp()` |
| 邮箱登录 | `supabase.auth.signInWithPassword()` |
| 游客访问 | `supabase.auth.signInAnonymously()` |
| 获取当前 session | `supabase.auth.getSession()` |
| 退出登录 | `supabase.auth.signOut()` |

### 4.2 业务数据接口

| 功能 | 表 | 操作 |
|---|---|---|
| 创建用户档案 | `profiles` | insert / upsert |
| 创建角色数据 | `characters` | insert / upsert |
| 保存手账 | `journals` | insert |
| 读取手账 | `journals` | select |
| 删除手账 | `journals` | delete |
| 点亮路线 | `unlocked_trails` | upsert |
| 读取点亮路线 | `unlocked_trails` | select |

### 4.3 异常处理

前端对以下异常做了中文提示或兜底处理：

- 邮箱或密码错误
- 注册失败
- 游客登录失败
- Supabase 配置缺失
- 保存手账失败
- 数据加载失败

---

## 5. 数据库设计

数据库脚本位于：

```text
docs/supabase-schema.sql
```

### 5.1 表结构

#### profiles 用户档案表

用于保存用户基本信息。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键，对应 auth.users.id |
| username | text | 用户名 |
| avatar | text | 头像 |
| gender | text | 用户性别 |
| birthday | text | 生日 |
| traveler_gender | text | 像素旅人性别 |
| traveler_identity | text | 像素旅人身份 |
| level | integer | 用户等级 |
| experience | integer | 经验值 |
| created_at | timestamptz | 创建时间 |

#### characters 角色表

用于保存像素旅人数据。

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | uuid | 主键，对应 auth.users.id |
| character_type | text | 角色类型 |
| equipment | jsonb | 装备数据 |
| level | integer | 角色等级 |

#### journals 手账表

用于保存用户手账。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| trail_id | text | 路线 ID |
| title | text | 标题 |
| mood | text | 心情 |
| weather | text | 天气 |
| text | text | 文字记录 |
| images | jsonb | 图片 Base64 数组 |
| template | text | 手账模板 |
| created_at | timestamptz | 创建时间 |

#### unlocked_trails 路线点亮表

用于记录用户已点亮路线。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| trail_id | text | 路线 ID |
| created_at | timestamptz | 点亮时间 |

### 5.2 数据完整性

- 所有业务数据都通过 `user_id` 关联用户。
- `unlocked_trails` 对 `(user_id, trail_id)` 设置唯一约束，避免重复点亮同一路线。
- `images` 和 `equipment` 使用 JSONB，方便保存数组和结构化数据。
- 所有表启用 RLS，防止用户访问其他人的数据。

---

## 6. 部署上线

### 6.1 部署平台

前端部署到 Vercel，数据库与认证服务使用 Supabase。

### 6.2 部署流程

1. 推送代码到 GitHub 仓库 `cllyw0618/trailmemo`。
2. Vercel 关联 GitHub 仓库。
3. 设置构建命令：`npm run build`。
4. 设置输出目录：`dist`。
5. 添加 Supabase 环境变量。
6. 每次 push 到 main 分支后自动重新部署。

### 6.3 环境变量

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

---

## 7. 项目文档清单

| 文档 | 说明 |
|---|---|
| `README.md` | 项目总览、运行方式、技术栈、功能说明 |
| `docs/project-documentation.md` | 面向评分细则的技术说明文档 |
| `docs/supabase-schema.sql` | 数据库建表和 RLS 权限脚本 |
| `DEFENSE_SCRIPT.md` | 三分钟答辩展示稿 |
| `PROJECT_DEFENSE.md` | 老师可能追问的技术原理说明 |

---

## 8. 演示与答辩流程

建议答辩时按照以下顺序演示：

1. 展示首页，说明项目定位。
2. 点击进入认证页，展示注册、登录、游客访问。
3. 进入 3D 地图页，旋转地球并点击路线点。
4. 进入手账编辑页，展示路线选择、图片上传、模板排版。
5. 保存手账后说明路线点亮和数据保存。
6. 打开成长页，展示像素旅人的等级和装备变化。
7. 打开背包页，展示记忆列表、成就、已点亮地点和删除管理。
8. 说明 Supabase 数据库表和 Vercel 部署。

---

## 9. 可回答的技术问题

### Q1：为什么使用 Vue3？

Vue3 的 Composition API 更适合把认证、地图、手账、成长系统拆成独立逻辑模块，组件化结构清晰，也符合前端框架课程要求。

### Q2：为什么用 Pinia？

项目有多个页面共享用户、路线、手账、角色数据，如果只用组件传参会很混乱。Pinia 可以集中管理全局状态，让 `MapView`、`JournalEditorView`、`GrowthView`、`MemoryView` 使用同一份数据。

### Q3：3D 地球怎么实现？

`TrailMap3D.vue` 使用 Three.js 创建 Scene、Camera、Renderer，再使用球体几何体加载地球纹理。路线点通过经纬度转换成三维坐标，再用 Sprite 标记在球面上。

### Q4：数据怎么保存？

用户登录后，Supabase 会提供 `user.id`。手账记录保存到 `journals` 表，点亮路线保存到 `unlocked_trails` 表，角色数据保存到 `characters` 表。所有表都通过 `user_id` 关联。

### Q5：游客访问是否真的有后端数据？

是的。游客访问不是前端假用户，而是调用 Supabase 的匿名登录接口，生成真实的匿名用户 UUID，因此也可以保存数据。

### Q6：成长系统怎么计算？

成长等级根据 `unlockedTrailIds.length` 计算。点亮路线数量达到 1、3、5、8、12、16 时，角色等级和装备展示会发生变化。

---

## 10. 后续可扩展方向

- 增加邮箱绑定入口，让游客用户保存长期进度。
- 增加图片上传到 Supabase Storage，减少数据库 Base64 压力。
- 增加路线筛选和搜索。
- 增加手账导出图片功能。
- 增加更多成长装备和成就徽章。
