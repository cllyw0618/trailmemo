# TrailMemo 项目运行原理说明稿（老师追问版）

---

## 1. 项目整体架构

整个项目采用前后端分离结构：

```
用户浏览器
    │
    ▼
Vue 3 前端（Vite 构建）
    │
    ▼
Pinia 状态管理（全局数据共享）
    │
    ▼
Supabase API（认证 + 数据库）
    │
    ▼
PostgreSQL 数据库
```

- **Vue 3**：负责页面展示和用户交互
- **Pinia**：负责管理跨页面共享的数据（用户、手账、路线、旅人）
- **Three.js**：负责三维地图渲染
- **Supabase**：提供用户认证和数据库服务
- **Vercel**：负责前端部署

---

## 2. 项目启动流程

项目入口文件：`src/main.js`

它主要完成三个任务：

**第一**：创建 Vue 应用 `createApp(App)`

**第二**：注册全局插件 `app.use(createPinia())` + `app.use(router)`

**第三**：启动时初始化用户状态：

```js
async function bootstrap() {
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia).use(router)

  const auth = useAuthStore(pinia)
  await auth.initAuth()  // ← 关键：初始化认证
  if (auth.user) {
    traveler.createTraveler(...)
    await memory.loadUserData()
  }
  app.mount('#app')
}
```

`initAuth()` 的作用：检查当前浏览器是否存在 Supabase session。

**如果存在 session**：
```
用户打开网站 → 检测 session → 恢复用户身份 → 加载个人数据 → 进入地图
```

**如果不存在 session**：
```
用户打开网站 → user 为 null → 进入 Loading 页面
→ 点击「唤醒山野记忆」→ 跳转 /auth 页面
→ 用户选择：注册 / 登录 / 游客访问
```

---

## 3. 路由结构

文件：`src/router/index.js`

| 路径 | 组件 | 作用 |
|------|------|------|
| `/` | LoadingView | 加载页，展示项目主题，引导进入 |
| `/auth` | AuthView | 三种认证方式：邮箱注册 / 邮箱登录 / 游客访问；注册时创建像素旅人 |
| `/map` | MapView | 3D 地球探索，沉浸式全屏体验 |
| `/journal/new` | JournalEditorView | 选择路线 → 写文字 → 上传照片 → 选模板 → 生成手账 |
| `/memory` | MemoryView | 旅人档案：等级、点亮路线、成就、章节进度、手账列表 |

---

## 4. 用户认证实现

核心文件：`src/stores/authStore.js`

### 4.1 状态管理

```js
state: {
  user,       // 当前用户信息
  session,    // Supabase 会话
  profile,    // 用户档案
  isAnonymous // 是否游客
}
```

### 4.2 initAuth() — 初始化认证

```
启动项目
    ↓
调用 supabase.auth.getSession()
    ↓
有 session？
    ├── 是 → loadProfile() 加载用户资料 → 进入地图
    └── 否 → user 设为 null → 进入 Loading 页面
              → 用户点击「唤醒山野记忆」→ 跳转 /auth
```

### 4.3 AuthView — 三种认证模式

认证页面（`src/views/AuthView.vue`）通过三个 Tab 切换提供三种进入方式：

| 模式 | 说明 | 触发方法 |
|------|------|----------|
| **注册** | 填写邮箱+密码+昵称等信息，创建正式账号 | `auth.register()` |
| **登录** | 已有账号，输入邮箱+密码直接登录 | `auth.login()` |
| **游客访问** | 无需邮箱密码，一键进入体验 | `auth.anonymousLogin()` |

注册模式下额外提供：
- **像素旅人创建**：选择性别（男/女形象）和初始身份（森林新人/海岸旅人/山峰探索者）
- 实时预览 `PixelTraveler` 组件，展示当前选择的旅人形象

游客访问模式下：
- 隐藏邮箱密码表单，直接点击「以游客身份进入 ✦」
- 后续可在设置中绑定邮箱升级为正式账号，数据不丢失

### 4.4 anonymousLogin() — 游客登录

```js
supabase.auth.signInAnonymously()
```

执行后 Supabase 会创建一个匿名用户：
```
auth.users 表：
  id: "abc123..."
  is_anonymous: true
```

然后项目创建对应的 `profiles` 记录，保存用户昵称、性别、生日等。

### 4.5 邮箱绑定 — 游客升级正式账号

**关键优势**：不会产生新的 user_id。

```
游客账号（user_id: abc123）
    ↓
用户输入邮箱 + 密码
    ↓
调用 supabase.auth.updateUser({ email, password })
    ↓
身份升级为正式账号
    ↓
之前的所有数据（徒步记录、路线收藏、角色装备）全部保留
```

---

## 5. 状态管理（Pinia）

### 5.1 authStore — 用户身份

```js
state: { user, session, profile, isAnonymous }
actions: { initAuth, anonymousLogin, register, login, logout }
```

### 5.2 memoryStore — 探索数据

```js
state: {
  trails,           // 18 条路线数据
  unlockedTrailIds, // 已解锁路线 ID 列表
  journals,         // 手账列表
}

getters: {
  growthLevel,           // 成长等级（山野新手 → 地球漫游者）
  achievementTypeStats,  // 成就类型统计（草甸×2、雪山×1...）
  chapterProgress,       // 章节进度（向山而行 2/4）
  unlockedCount,         // 已解锁路线数
  totalDistanceKm,       // 累计公里数
}
```

**用户保存手账时的数据流**：
```
点击保存
    ↓
memoryStore.addJournal(journal)
    ↓
判断该路线是否首次解锁 → 返回 isNewlyUnlocked
    ↓
更新本地状态：journals.unshift(...) + unlockedTrailIds.push(...)
    ↓
异步写入 Supabase（journals 表 + unlocked_trails 表）
```

### 5.3 travelerStore — 像素旅人

```js
state: {
  gender: 'male' | 'female',
  identity: 'forest' | 'coast' | 'mountain',
  unlockedEquipment: []
}
```

---

## 6. 3D 地图实现原理

核心组件：`src/components/TrailMap3D.vue`

### 6.1 场景创建

```
创建 Scene（场景容器）
    ↓
创建 PerspectiveCamera（透视相机，42° 视角）
    ↓
创建 WebGLRenderer（渲染器，输出到 Canvas）
    ↓
创建 OrbitControls（轨道控制器，支持旋转/缩放）
```

### 6.2 地球渲染

```js
// 创建球体几何体
new THREE.SphereGeometry(2.18, 128, 80)
// 参数：半径 2.18，水平分段 128，垂直分段 80

// 加载纹理
const earthTexture = textureLoader.load('/textures/earth_atmos_2048.jpg')

// 创建材质
new THREE.MeshStandardMaterial({
  map: earthTexture,      // 颜色贴图
  bumpMap: bumpTexture,   // 凹凸贴图（增加立体感）
  bumpScale: 0.035,
  roughness: 0.55,
  metalness: 0.02,
})
```

### 6.3 灯光系统（5 层光照）

```
HemisphereLight    — 环境光（模拟天空/地面反射）
DirectionalLight   — 主方向光（模拟太阳）
PointLight（粉色） — 补光（增加暖色调）
DirectionalLight   — 轮廓光（从背后打亮边缘）
DirectionalLight   — 填充光（消除暗部）
```

### 6.4 云层和大气

```
云层：程序化生成 Canvas 纹理 → 半透明球体叠加
     + AdditiveBlending（加法混合，模拟发光）
大气光晕：双层透明球体
     BackSide（只渲染背面，模拟边缘发光）
     + AdditiveBlending（内光晕）
```

### 6.5 经纬度 → 三维坐标转换

```js
function latLonToVector3(latitude, longitude, radius = 2.18) {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),  // x
     radius * Math.cos(phi),                     // y
     radius * Math.sin(phi) * Math.sin(theta),   // z
  )
}
```

**原理**：球坐标 → 直角坐标。纬度转为极角 φ，经度转为方位角 θ，通过三角函数计算球面上的 xyz 位置。

### 6.6 标记点渲染

每个路线位置生成一个 `Sprite`（始终面向相机的平面）：

```
已解锁路线：绿色发光圆点（#4ade80）
未解锁路线：蓝色圆点（#93c5fd）
选中路线：  放大 + 亮绿色外圈
```

标记点纹理使用 Canvas 动态绘制径向渐变。标记点有脉动动画：
```js
const pulse = 1 + Math.sin(t * 2.4 + index) * 0.08
marker.scale.set(baseScale * pulse, baseScale * pulse, 1)
```

### 6.7 标签防重叠算法

由于多条路线地理位置相近时标签会重叠，使用切线平面偏移算法：

```js
// 1. 计算标记点的法线方向（从球心指向外）
const dir = basePos.clone().normalize()

// 2. 计算切线平面的东方向和北方向
const east = new Vector3().crossVectors(dir, up).normalize()
const north = new Vector3().crossVectors(east, dir).normalize()

// 3. 用经纬度生成唯一偏移角度
const offsetAngle = (lon * 0.7 + lat * 1.1) * 0.12

// 4. 在切线平面内偏移标签位置
label.position = basePos
  .add(east * Math.cos(offsetAngle) * 0.09)
  .add(north * Math.sin(offsetAngle) * 0.09)
```

### 6.8 点击检测

```js
// 使用 Raycaster 射线检测
const raycaster = new THREE.Raycaster()

function onCanvasClick(event) {
  // 1. 将屏幕坐标转为归一化设备坐标 (-1 到 1)
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 2. 从相机发射射线
  raycaster.setFromCamera(pointer, camera)

  // 3. 检测射线与标记点的交点
  const intersects = raycaster.intersectObjects(markerMeshes)

  // 4. 获取被点击的路线数据
  const trail = intersects[0].object.userData.trail
}
```

---

## 7. 手账系统

### 7.1 创建流程

核心页面：`src/views/JournalEditorView.vue`

```
Step 1: 选择路线（从 URL 参数 trailId 自动选中）
    ↓
Step 2: 填写内容
    - 标题
    - 天气（下拉选择）
    - 心情（下拉选择）
    - 文字记录
    - 上传照片（Canvas 压缩到 800px 宽，存为 Base64）
    ↓
Step 3: 选择模板（4 种布局）
    - t1: 一图日记（1 张主图 + 文字）
    - t2: 两张瞬间（2 张图，主图+侧图）
    - t3: 三格旅页（3 张图错落排版）
    - t4: 四宫拼贴（4 张图 + 便签纸）
    ↓
实时预览（CollageCard 组件）
    ↓
保存 → 弹出"路线已点亮"反馈
```

### 7.2 照片处理

```js
// Canvas 压缩：避免 Base64 过大
function compressImage(file) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.src = URL.createObjectURL(file)
  // 缩放到 800px 宽度
  const ratio = 800 / img.width
  canvas.width = 800
  canvas.height = img.height * ratio
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8) // JPEG 80% 质量
}
```

### 7.3 拼贴卡片组件

核心组件：`src/components/CollageCard.vue`

**5 种模板**使用 CSS Grid 实现：

| 模板 | 布局方式 | 说明 |
|------|---------|------|
| t1 | 单列 Grid | 主图 + 居中文字 |
| t2 | `grid-template-areas: 'main note' 'main side'` | 主图占据左侧两行 |
| t3 | 绝对定位 | 3 张图错落 + 浮动文字卡片 |
| t4 | 绝对定位 | 4 张图 + 便签纸 |

**视觉细节**：
- 每张照片 `rotate(±1~2°)` 随机旋转，模拟手账真实感
- 顶部胶带装饰（`tape-tl`、`tape-tr` 半透明纸胶带）
- 底部「回忆卡」脚注：显示章节名、情绪关键词、诗句引语

---

## 8. 像素旅人实现

核心组件：`src/components/PixelTraveler.vue`

**绘制原理**：使用 HTML Canvas 逐像素绘制

```
画布大小：40×56 像素网格
每个像素放大 4 倍 → 实际显示 160×224px
```

**分层渲染顺序**（从底层到顶层）：
```
地面 → 腿 → 鞋子 → 袜子 → 身体 → 手臂 → 手 → 头部 → 耳朵
→ 头发 → 眼睛 → 眉毛 → 腮红 → 鼻子 → 嘴巴
→ 耳机 → 帽子 → 背包 → 登山杖 → 围巾 → 徽章 → 手持道具
```

**等级装备变化逻辑**：

```js
function getEquip(lv) {
  if (lv >= 16) return { hat: 'wide', coat: 'legend', bag: 'legend', staff: true, badge: 3 }
  if (lv >= 12) return { hat: 'wide', coat: 'pink', bag: 'big', badge: 2 }
  if (lv >= 8)  return { hat: 'beanie', coat: 'purple', bag: 'big', staff: true, scarf: true }
  // ...
}
```

Vue 通过 `watch` 监听 `level` 变化，自动触发 Canvas 重绘。

---

## 9. 成长系统

### 9.1 等级计算

核心：`src/stores/memoryStore.js` 的 `growthLevel` getter

```js
const LEVELS = [
  { min: 0, name: '山野新手' },
  { min: 1, name: '初入山野' },
  { min: 3, name: '草甸行者' },
  { min: 5, name: '峡谷探索者' },
  { min: 8, name: '雪山旅人' },
  { min: 12, name: '远方收藏家' },
  { min: 16, name: '地球漫游者' },
]

// 返回值示例：
{
  levelName: '草甸行者',
  current: 3,        // 已解锁 3 条
  nextTarget: 5,      // 下一级需要 5 条
  progressPercent: 60, // 进度 60%
  nextLevelName: '峡谷探索者'
}
```

### 9.2 成就系统

核心：`src/data/achievements.js`

11 个成就定义，每个都是纯函数判断：

```js
{ id: 'first_trail', name: '第一束山风', check: stats => stats.unlockedCount >= 1 }
{ id: 'grassland_collector', name: '草甸收藏家', check: stats => stats.types.grassland >= 1 }
// ...
```

**前端纯计算**，无需后端参与。`checkAchievements(stats)` 遍历所有成就，返回 `{ id, name, description, unlocked }` 数组。

### 9.3 章节进度

18 条路线按 `chapter` 字段分为 4 章：

| 章节 | 路线 | 路线数 |
|------|------|--------|
| 向山而行 | 武功山、麦理浩径、南太行、徽杭古道 | 4 |
| 进入荒野 | 虎跳峡、雨崩、乌孙古道、贡嘎 | 4 |
| 朝圣之路 | 冈仁波齐、五台山、圣地亚哥 | 3 |
| 世界远方 | EBC、TMB、百内W、汤加里罗、乞力马扎罗、PCT、利西亚之路 | 7 |

统计时遍历 `trails` 数组，按 `chapter` 分组，对比 `unlockedTrailIds` 计算完成数。

---

## 10. 数据库设计

### 10.1 主要表结构

**profiles** — 用户档案：
```
id (UUID, PK)        — 关联 auth.users
username             — 昵称
avatar               — 头像
gender               — 性别
birthday             — 生日
traveler_gender      — 旅人性别
traveler_identity    — 旅人初始身份
level                — 等级
experience           — 经验值
```

**characters** — 像素角色：
```
user_id (UUID, PK)   — 关联 auth.users
character_type       — 角色类型
equipment            — 已解锁装备列表（JSON）
level                — 角色等级
```

**unlocked_trails** — 已解锁路线：
```
user_id (UUID)       — 关联 auth.users
trail_id (TEXT)      — 路线 ID
created_at           — 解锁时间
主键：(user_id, trail_id) 联合唯一
```

**journals** — 手账记录：
```
id (UUID, PK)
user_id (UUID)       — 关联 auth.users
trail_id (TEXT)      — 路线 ID
title                — 标题
mood                 — 心情
weather              — 天气
text                 — 文字内容
images (JSONB)       — 照片 Base64 数组
template             — 模板类型
created_at           — 创建时间
```

### 10.2 数据隔离

所有业务数据通过 `user_id` 关联 Supabase 用户，不同用户只能看到自己的数据：
- 自己的手账
- 自己的路线解锁记录
- 自己的成长数据

---

## 11. 项目核心创新

如果老师问「你的项目创新在哪里」：

> 我的项目不是简单的旅行记录工具，而是把三维地图探索、拼贴手账记录和像素角色成长机制结合起来。用户通过完成真实世界中的徒步行为，在虚拟空间中不断点亮路线和提升角色等级，让旅行记录从一次性的保存变成长期积累的探索过程。
>
> 具体来说有三个创新点：
>
> 1. **游戏化探索体验**：用 Three.js 构建 3D 地球，让路线选择变成"世界探索"，而非表格列表
> 2. **像素角色成长**：在注册流程中加入角色创建，等级驱动装备变化，增强了用户粘性
> 3. **轻量成就系统**：纯前端计算 11 个成就，无需后端开销，但能有效激励用户持续使用

---

## 12. 答辩常见追问

**Q: 前端怎么和 Three.js 配合？**
A: Three.js 的 Scene/Renderer/Camera 在 Vue 组件的 `onMounted` 中创建，`onBeforeUnmount` 中销毁。标记点数据通过 props 传入，Vue 的 `watch` 监听数据变化自动重建标记点。Canvas 渲染独立于 Vue 虚拟 DOM，通过 `requestAnimationFrame` 循环渲染。

**Q: Pinia 和 Vuex 有什么区别？**
A: Pinia 是 Vue 3 官方推荐的状态管理库。相比 Vuex：没有 mutations（直接用 actions 修改 state）、完整的 TypeScript 支持、模块化更简单（每个 store 独立定义）、支持 Composition API 风格。

**Q: 认证页面有哪些登录方式？**
A: `/auth` 页面通过三个 Tab 切换，提供三种方式：① 邮箱注册（填写邮箱+密码+昵称，创建正式账号，同时创建像素旅人形象）；② 邮箱登录（已有账号直接登录）；③ 游客访问（无需填写任何信息，一键进入体验，后续可绑定邮箱升级）。三种方式共用同一个提交按钮，`mode` 状态决定调用 `auth.register()`、`auth.login()` 还是 `auth.anonymousLogin()`。

**Q: 游客登录后数据怎么保存？**
A: Supabase 的匿名登录会生成一个真实的 UUID。用户点击「游客访问」后，调用 `signInAnonymously()` 创建匿名用户，所有使用数据（手账、路线解锁）都关联到这个 UUID。用户后续绑定邮箱时，调用 `updateUser()` 将匿名账户升级，user_id 不变，所有历史数据自动保留。如果没有 Supabase 配置，则使用本地 Pinia 内存存储（刷新页面丢失）。

**Q: 手账照片怎么存的？**
A: 上传后用 Canvas 压缩到 800px 宽度，转为 JPEG Base64（约 80% 质量），存入 Supabase 的 JSONB 字段 `images` 数组中。这样无需文件服务器，且单张照片约 50-100KB，不会让数据库过大。

**Q: 为什么不直接用地图 API（如高德/Google Maps）？**
A: 地图 API 是 2D 的，且样式定制有限。Three.js 提供完全的 3D 渲染控制，可以实现地球旋转、标记点发光脉动、云层、粒子特效等游戏化视觉效果，更符合"探索世界"的产品定位。
---

## 最新页面调整说明：成长装备页

为了让项目工作量和成长机制在答辩中更直观，项目新增了独立的 `/growth` 页面，并将底部导航调整为四个入口：

```text
探索 -> 日记 -> 成长 -> 背包
```

其中“成长”页面由 `GrowthView.vue` 承载，内部复用 `GrowthSystemPanel.vue`。它展示六个成长等级：

- Lv.1 山野新人
- Lv.3 草甸行者
- Lv.5 峡谷探索者
- Lv.8 雪山旅人
- Lv.12 远方收藏家
- Lv.16+ 地球漫游者

该页面的数据来源不是静态展示，而是与 `memoryStore.unlockedCount` 联动。用户点亮路线数量越多，当前成长阶段越高，`PixelTraveler.vue` 中的 Canvas 像素角色也会按等级切换装备。

答辩时可以这样解释：

> 我把成长系统单独做成一个页面，是为了让用户更直观看到自己的探索进度。它不是孤立页面，而是与路线点亮数量联动。点亮路线后，Pinia 中的 `unlockedTrailIds` 会变化，成长页根据这个数量展示对应等级和装备。这体现了 Vue 组件复用、状态管理和数据驱动视图的思想。
