# VisePanda 游客端迁移为 Web 体系设计

日期：2026-06-17

## 目标

将当前以 `apps/traveler-android` 为主的游客端形态调整为网页端体系，并保留 `ops-web` 与 `admin-web` 作为独立后台应用。首版不再继续推进 Android 作为主要交付端，而是在 Monorepo 中新增 `apps/traveler-web`，把游客侧完整闭环迁移到 Web：

- 内容浏览
- AI 行程规划
- Trip 保存
- Trip 列表
- Trip 详情
- 保存时登录

目标不是重做整个平台，而是在现有后端与后台基础上，尽快形成三个独立 Web 应用：

- `traveler-web`
- `ops-web`
- `admin-web`

## 非目标

本轮不做以下事项：

- 不把三端合并成单一超级 Web 应用
- 不对 `ops-web` 和 `admin-web` 做大规模架构重写
- 不继续扩展 Android 功能
- 不引入支付、分享、协作、数据看板
- 不在本轮完成统一设计系统抽包
- 不做深度 SEO、增长体系、埋点体系

## 方案结论

采用三个独立 Web 应用的形态：

- `apps/traveler-web`：游客前台
- `apps/ops-web`：内容运营后台
- `apps/admin-web`：管理后台

这是当前仓库结构下风险最低、迁移最快、最适合逐步替换 Android 的方式。

## 用户使用方式

`traveler-web` 首版采用“游客可浏览，保存时再登录”的策略。

具体规则：

- 用户打开首页即可直接浏览内容
- 用户可直接进入目的地详情与工具内容
- 用户可直接使用 AI 行程规划
- 当用户尝试执行“保存 Trip”或“查看我的行程”等资产化动作时，才要求登录或注册
- 登录成功后，应返回原操作并继续执行，而不是让用户重新走一遍流程

这样可以降低首次进入门槛，同时保留现有账号体系和行程资产能力。

## 应用边界

### traveler-web

负责游客侧主路径：

- 首页
- 目的地列表与详情
- 工具内容列表与详情
- AI 行程规划
- Trip 保存
- Trip 列表
- Trip 详情
- 登录/注册弹出或跳转

### ops-web

继续负责内容运营：

- 草稿
- 编辑
- 审核
- 发布
- 素材

本轮仅维持其独立后台定位，不纳入游客侧功能。

### admin-web

继续负责平台管理：

- 用户管理
- 角色/状态调整
- 模型权限入口

本轮仅维持其独立后台定位，不纳入游客侧功能。

## traveler-web 功能范围

首版按完整游客闭环建设，覆盖以下模块。

### 内容浏览

- 目的地列表页
- 目的地详情页
- 工具列表页
- 工具详情页

数据来源直接使用现有游客端消费接口：

- `GET /destinations`
- 目的地详情接口
- `GET /tools`
- 工具详情接口

### AI 行程规划

- 行程规划输入页
- 行程规划结果页
- 结果页支持“保存为 Trip”

数据来源使用现有 AI 接口：

- `POST /ai/tasks/plan-trip`
- 视需要接入 `POST /ai/chat`

### Trip 资产化

- Trip 列表页
- Trip 详情页
- 从 AI 结果保存 Trip
- 未登录时触发登录门禁

数据来源使用现有 Trip 接口：

- `POST /trips`
- `GET /trips`
- `GET /trips/:id`
- `POST /trips/:id/snapshot`

### 登录/注册

保留已有后端账号能力，但不作为默认起点。

接入接口：

- `POST /auth/register`
- `POST /auth/login`

前端职责：

- 在需要用户资产时触发登录流程
- 登录成功后恢复原先动作
- 维持当前会话 token

## 路由设计

`traveler-web` 首版建议使用以下路由：

- `/`：首页
- `/destinations`：目的地列表
- `/destinations/[id]`：目的地详情
- `/tools`：工具列表
- `/tools/[id]`：工具详情
- `/ai/plan-trip`：AI 行程规划
- `/trips`：我的行程
- `/trips/[id]`：行程详情
- `/login`：登录/注册页

### 路由门禁规则

公开路由：

- `/`
- `/destinations`
- `/destinations/[id]`
- `/tools`
- `/tools/[id]`
- `/ai/plan-trip`

受保护路由：

- `/trips`
- `/trips/[id]`

动作级门禁：

- 未登录用户在 AI 结果页点击“保存 Trip”时，跳转或弹出 `/login`
- 登录成功后回到 AI 结果页，并继续执行保存

## 页面流转

### 浏览内容主链路

`首页 -> 目的地列表 -> 目的地详情 -> AI 规划`

### AI 规划主链路

`AI 输入 -> AI 结果 -> 保存 Trip -> 如未登录则登录 -> 保存成功 -> 跳转 Trip 详情`

### 我的行程主链路

`我的行程列表 -> 行程详情 -> 快照生成`

## 前端结构建议

新增：

- `apps/traveler-web`

推荐目录：

- `src/app`：页面路由
- `src/components`：页面级与通用组件
- `src/lib`：请求、鉴权、格式化工具
- `src/features/content`
- `src/features/ai`
- `src/features/trips`
- `src/features/auth`

### 与后台应用的关系

`traveler-web` 不直接复用 `ops-web` / `admin-web` 页面结构，但复用相同技术栈与部分基础模式：

- Next.js App Router
- 前端代理 API Route
- cookie 或 localStorage 的轻量 token 管理

本轮允许先复制轻量工具实现，不强制抽公共包。只有当三个 Web 应用都稳定后，再考虑抽离 `packages/ui` 或 `packages/web-shared`。

## 鉴权设计

游客前台的鉴权重点不是“全站登录守卫”，而是“按动作守卫”。

建议策略：

- 公开页面默认放行
- 访问 `/trips`、`/trips/[id]` 时检查 token
- 需要保存 Trip 时检查 token
- 没有 token 时，将当前上下文写入重定向参数或临时状态
- 登录成功后恢复到原动作

需保留的信息：

- 登录前所在页面
- AI 结果页的输入参数或结果上下文
- 待执行动作类型，例如 `save-trip`

## 数据流设计

### 内容

页面直接请求 `traveler-web` 的同源 API Route，再由其转发到 `apps/api`。

原因：

- 避免浏览器跨域和端口问题
- 保持和现有后台一致的调用模型
- 未来更容易引入服务端缓存和鉴权透传

### AI

AI 规划页提交参数给前端 Route Handler，再转发到后端 AI 接口。

响应中保留：

- `answer`
- `taskType`
- `model`
- `provider`
- `routePolicy`
- `promptTemplateVersion`
- `logId`

其中 `logId` 在保存 Trip 时继续透传给后端，用于关联 `GenerationRecord`。

### Trips

Trip 相关请求必须带 token。

保存 Trip 时：

1. 检查当前是否已登录
2. 未登录则进入登录流程
3. 登录成功后重新提交保存请求
4. 保存成功后跳转到 Trip 详情页

## 错误处理

首版错误处理采用简单明确的策略：

- 内容加载失败：页面内错误提示 + 重试按钮
- AI 规划失败：表单区域错误提示，不清空原输入
- Trip 保存失败：提示失败原因，并允许再次提交
- 登录失败：保留输入内容并展示错误信息
- token 失效：清理本地会话并跳转登录

统一错误展示优先使用页面内提示，不引入复杂消息中心。

## 测试策略

首版至少覆盖：

### 页面与路由

- 首页可访问
- 公开内容页可访问
- 未登录访问 `/trips` 被重定向到登录

### 登录门禁

- 未登录点击“保存 Trip”会进入登录流程
- 登录成功后回到原操作并完成保存

### 关键接口联调

- 内容列表加载成功
- AI 行程规划成功
- Trip 保存成功
- Trip 列表/详情读取成功

### 回归边界

- `ops-web` 与 `admin-web` 的现有行为不受影响
- API 契约不需要为迁移前台而做破坏性调整

## 迁移策略

迁移分三步：

1. 新建 `traveler-web` 工程骨架与路由壳
2. 先接入内容浏览与 AI 规划
3. 再接入登录门禁和 Trip 资产化

Android 处理方式：

- 暂停继续扩展
- 保留仓库目录作为历史实现与参考
- 不再作为首发端目标

## 风险与约束

### 风险 1：前后台共享能力分散

短期内容易出现多个 Web 应用各自维护一套工具函数的问题。

处理方式：

- 首版允许轻量复制
- 第二阶段再抽公共层

### 风险 2：登录后恢复原操作复杂

AI 结果页保存 Trip 时需要恢复用户上下文。

处理方式：

- 首版通过 query 参数或 sessionStorage 保存待执行动作
- 不引入复杂全局状态系统

### 风险 3：功能范围膨胀

如果同时重构三个 Web 应用，会拖慢首版交付。

处理方式：

- 本轮只新增 `traveler-web`
- `ops-web` 与 `admin-web` 只保持稳定，不做大重写

## 实施边界结论

本设计的交付范围是：

- 新增 `apps/traveler-web`
- 将游客端完整闭环迁移到 Web
- 使用“游客可浏览，保存时再登录”的产品策略
- 保留 `ops-web` 与 `admin-web` 独立存在
- 暂停 Android 作为主前台目标

本设计不包含后台重构和统一设计系统抽离，这些内容留待后续单独规划。

