# VisePanda 平台化重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零构建 VisePanda 中国旅行服务平台，按阶段完成游客端 App、内容运营后台、管理后台、统一后端平台和全新数据库，不沿用旧数据库，并在首版支持账号体系、内容运营、多模型路由和行程资产化。

**Architecture:** 采用平台化模块架构和单仓多应用方式，前台与后台共用统一后端能力，但在后端内部按权限域、内容域、AI 域、行程域拆分模块。首版先完成平台底座和核心闭环，再在增强阶段扩展灰度策略、协作能力和数据看板。

**Tech Stack:** `pnpm` Monorepo、`Next.js` Web 后台、`NestJS` API、`PostgreSQL`、`Prisma`、`Redis`、`S3/OSS`、`Android Kotlin + Jetpack Compose`、`OpenAPI`、`Docker`、`GitHub Actions`

---

## 规划说明

这是一份 `主实施规划书`。  
由于当前规格覆盖多个独立子系统，不建议直接把全部工作混成一条执行链，而应拆成以下 5 条并行但有依赖的工作流：

1. 平台底座与基础工程
2. 后端核心领域
3. 游客端 App
4. 内容运营后台与管理后台
5. 集成测试、发布与增强阶段

本计划的用途是：

- 先把项目拆解顺序和依赖钉住
- 明确推荐仓库结构和模块落点
- 给后续子计划提供主骨架

## 推荐仓库结构

### 顶层目录

- `apps/traveler-android`：游客端 Android App
- `apps/ops-web`：内容运营后台
- `apps/admin-web`：管理后台
- `apps/api`：统一 API 与 BFF
- `packages/domain-auth`：权限域模块
- `packages/domain-content`：内容域模块
- `packages/domain-ai`：AI 编排域模块
- `packages/domain-trip`：行程域模块
- `packages/shared-types`：跨端共享类型
- `packages/shared-config`：环境与配置
- `packages/openapi`：接口契约
- `infra/docker`：本地开发依赖
- `infra/migrations`：数据库迁移与种子数据
- `docs/architecture`：架构图和对象模型文档
- `docs/runbooks`：部署与运维说明

### 数据对象落点

- 认证与权限模型：`packages/domain-auth`
- 内容模型与发布流：`packages/domain-content`
- 模型策略与调用编排：`packages/domain-ai`
- 行程资产与快照：`packages/domain-trip`

## 依赖顺序

必须遵守以下顺序：

1. 平台底座先于业务模块
2. 权限域先于后台准入与用户资产
3. 内容域先于 AI 上下文装配
4. AI 域先于 Chat 与内容辅助生成
5. 行程域先于 Trips 和保存功能
6. API 先稳定契约，再接 App 和 Web

## Task 1：初始化单仓工程与开发底座

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `turbo.json`
- Create: `.editorconfig`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `infra/docker/docker-compose.yml`
- Create: `infra/migrations/README.md`
- Create: `docs/architecture/repo-structure.md`
- Create: `docs/runbooks/local-development.md`

- [ ] **Step 1: 创建 Monorepo 基础目录**

Run: `mkdir -p apps/{api,ops-web,admin-web,traveler-android} packages/{domain-auth,domain-content,domain-ai,domain-trip,shared-types,shared-config,openapi} infra/{docker,migrations} docs/{architecture,runbooks}`
Expected: 所有顶层目录创建成功，无报错

- [ ] **Step 2: 写入工作区配置**

在 `pnpm-workspace.yaml` 中声明：
```yaml
packages:
  - apps/*
  - packages/*
```

在 `package.json` 中声明：
```json
{
  "name": "visepanda-platform",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

- [ ] **Step 3: 加入本地基础依赖**

在 `infra/docker/docker-compose.yml` 中定义：
- `postgres`
- `redis`
- `minio` 或兼容对象存储

Expected: `docker compose -f infra/docker/docker-compose.yml config` 通过

- [ ] **Step 4: 编写本地开发说明**

在 `docs/runbooks/local-development.md` 写清：
- 启动依赖命令
- 环境变量来源
- App、API、Web 的启动顺序
- 数据迁移入口

- [ ] **Step 5: 验证目录与命令**

Run: `pnpm install`
Expected: 根工作区依赖安装完成，未出现工作区解析错误

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize visepanda platform monorepo"
```

## Task 2：建立统一 API 工程和 OpenAPI 契约

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `packages/openapi/openapi.yaml`
- Create: `packages/shared-types/src/index.ts`
- Create: `docs/architecture/api-boundary.md`

- [ ] **Step 1: 初始化 API 应用**

Run: `cd /workspace && pnpm dlx @nestjs/cli new apps/api --package-manager pnpm --skip-git`
Expected: `apps/api` 初始化完成

- [ ] **Step 2: 定义首批接口分组**

在 `packages/openapi/openapi.yaml` 中先定义以下 tags：
- `Auth`
- `AdminUsers`
- `Destinations`
- `Tools`
- `AI`
- `Trips`

并为以下路径预留基础 schema：
- `/auth/register`
- `/auth/login`
- `/destinations`
- `/ai/chat`
- `/trips`

- [ ] **Step 3: 统一响应信封**

在 `packages/shared-types/src/index.ts` 中声明：
```ts
export interface ApiEnvelope<T> {
  success: boolean
  data: T
  requestId: string
  error?: {
    code: string
    message: string
  }
}
```

- [ ] **Step 4: 启动 API 骨架**

Run: `pnpm --filter api start:dev`
Expected: API 本地可启动，返回默认健康检查

- [ ] **Step 5: Commit**

```bash
git add apps/api packages/openapi packages/shared-types docs/architecture/api-boundary.md
git commit -m "feat: bootstrap api service and contract"
```

## Task 3：实现权限域与账号闭环

**Files:**
- Create: `packages/domain-auth/src/user.entity.ts`
- Create: `packages/domain-auth/src/role.entity.ts`
- Create: `packages/domain-auth/src/session.entity.ts`
- Create: `packages/domain-auth/src/auth.service.ts`
- Create: `packages/domain-auth/src/auth.controller.ts`
- Create: `infra/migrations/001_auth_init.sql`
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/test/auth.e2e-spec.ts`
- Create: `docs/architecture/auth-model.md`

- [ ] **Step 1: 先写权限域数据结构**

在 `infra/migrations/001_auth_init.sql` 创建：
- `users`
- `roles`
- `user_roles`
- `sessions`
- `profiles`

字段至少覆盖：
- `email`
- `password_hash`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

- [ ] **Step 2: 写鉴权 E2E 失败用例**

在 `apps/api/test/auth.e2e-spec.ts` 写出以下场景：
- 注册成功
- 重复邮箱注册失败
- 登录成功
- 状态为 `disabled` 的用户登录失败

- [ ] **Step 3: 实现最小认证逻辑**

在 `packages/domain-auth/src/auth.service.ts` 实现：
- `register()`
- `login()`
- `logout()`
- `verifySession()`

在 `apps/api/src/modules/auth/auth.module.ts` 暴露对应模块。

- [ ] **Step 4: 跑通鉴权测试**

Run: `pnpm --filter api test -- auth.e2e-spec.ts`
Expected: 所有首批账号测试通过

- [ ] **Step 5: 增加邮箱验证与重置密码占位接口**

实现接口路径但先只完成：
- token 生成
- token 校验
- 状态迁移

不接入真实邮件前可使用日志输出模拟。

- [ ] **Step 6: Commit**

```bash
git add packages/domain-auth apps/api infra/migrations docs/architecture/auth-model.md
git commit -m "feat: add auth domain and account lifecycle"
```

## Task 4：实现内容域与运营发布流

**Files:**
- Create: `packages/domain-content/src/destination.entity.ts`
- Create: `packages/domain-content/src/tool-guide.entity.ts`
- Create: `packages/domain-content/src/content-version.entity.ts`
- Create: `packages/domain-content/src/content.service.ts`
- Create: `packages/domain-content/src/content.controller.ts`
- Create: `infra/migrations/002_content_init.sql`
- Create: `apps/api/test/content.e2e-spec.ts`
- Create: `docs/architecture/content-model.md`

- [ ] **Step 1: 创建内容域表结构**

在 `infra/migrations/002_content_init.sql` 创建：
- `destinations`
- `pois`
- `guide_blocks`
- `tool_guides`
- `topics`
- `assets`
- `content_versions`

所有正式内容对象都必须有：
- `status`
- `locale`
- `version_no`
- `review_state`
- `published_at`

- [ ] **Step 2: 写内容发布流测试**

在 `apps/api/test/content.e2e-spec.ts` 覆盖：
- 草稿创建
- 审核通过
- 发布成功
- 回滚到上一版本

- [ ] **Step 3: 实现内容服务**

内容服务至少支持：
- 创建草稿
- 更新草稿
- 审核状态切换
- 发布版本
- 查询已发布内容

- [ ] **Step 4: 暴露游客端消费接口**

实现：
- `GET /destinations`
- `GET /destinations/{id}`
- `GET /tools`

- [ ] **Step 5: 验证内容域与发布流**

Run: `pnpm --filter api test -- content.e2e-spec.ts`
Expected: 内容域核心流程通过

- [ ] **Step 6: Commit**

```bash
git add packages/domain-content apps/api infra/migrations docs/architecture/content-model.md
git commit -m "feat: add content domain and publishing workflow"
```

## Task 5：实现 AI 编排域与多模型路由

**Files:**
- Create: `packages/domain-ai/src/model-profile.entity.ts`
- Create: `packages/domain-ai/src/task-type.entity.ts`
- Create: `packages/domain-ai/src/route-policy.entity.ts`
- Create: `packages/domain-ai/src/prompt-template.entity.ts`
- Create: `packages/domain-ai/src/ai-orchestrator.service.ts`
- Create: `packages/domain-ai/src/providers/provider.interface.ts`
- Create: `infra/migrations/003_ai_init.sql`
- Create: `apps/api/test/ai-routing.e2e-spec.ts`
- Create: `docs/architecture/ai-routing.md`

- [ ] **Step 1: 建 AI 配置表与日志表**

在 `infra/migrations/003_ai_init.sql` 创建：
- `model_providers`
- `model_profiles`
- `task_types`
- `route_policies`
- `prompt_templates`
- `invocation_logs`

- [ ] **Step 2: 先写路由策略测试**

在 `apps/api/test/ai-routing.e2e-spec.ts` 覆盖：
- 不同任务命中不同模型
- 主模型失败时走降级链
- 提示词版本切换后返回版本号

- [ ] **Step 3: 实现编排服务最小能力**

在 `packages/domain-ai/src/ai-orchestrator.service.ts` 实现：
- `resolveTaskType()`
- `selectModel()`
- `buildPrompt()`
- `invoke()`
- `recordLog()`

- [ ] **Step 4: 提供 API 层接口**

实现：
- `POST /ai/chat`
- `POST /ai/tasks/plan-trip`
- `GET /ai/models`
- `GET /ai/routes`

- [ ] **Step 5: 用假 Provider 跑通测试**

先用 `provider.interface.ts` 的 mock 实现跑完测试，再接真实模型供应商。

- [ ] **Step 6: Commit**

```bash
git add packages/domain-ai apps/api infra/migrations docs/architecture/ai-routing.md
git commit -m "feat: add ai orchestration and routing"
```

## Task 6：实现行程域与用户资产化

**Files:**
- Create: `packages/domain-trip/src/trip.entity.ts`
- Create: `packages/domain-trip/src/trip-day.entity.ts`
- Create: `packages/domain-trip/src/trip-item.entity.ts`
- Create: `packages/domain-trip/src/generation-record.entity.ts`
- Create: `packages/domain-trip/src/trip.service.ts`
- Create: `infra/migrations/004_trip_init.sql`
- Create: `apps/api/test/trip.e2e-spec.ts`
- Create: `docs/architecture/trip-model.md`

- [ ] **Step 1: 建行程域表**

在 `infra/migrations/004_trip_init.sql` 创建：
- `trips`
- `trip_days`
- `trip_items`
- `trip_snapshots`
- `favorites`
- `generation_records`

- [ ] **Step 2: 先写用户资产测试**

在 `apps/api/test/trip.e2e-spec.ts` 覆盖：
- AI 结果保存为 Trip
- Trip 生成 snapshot
- 用户只能读取自己的 Trip
- 删除 Trip 不影响 invocation log

- [ ] **Step 3: 实现 Trip 服务**

服务至少支持：
- 创建 Trip
- 更新 Trip
- 生成 Snapshot
- 记录来源 Chat/Task
- 收藏与取消收藏

- [ ] **Step 4: 暴露接口**

实现：
- `POST /trips`
- `GET /trips`
- `GET /trips/{id}`
- `POST /trips/{id}/snapshot`

- [ ] **Step 5: 测试通过**

Run: `pnpm --filter api test -- trip.e2e-spec.ts`
Expected: 行程资产逻辑通过

- [ ] **Step 6: Commit**

```bash
git add packages/domain-trip apps/api infra/migrations docs/architecture/trip-model.md
git commit -m "feat: add trip domain and asset lifecycle"
```

## Task 7：实现游客端 App MVP

**Files:**
- Create: `apps/traveler-android/app/build.gradle.kts`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/MainActivity.kt`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/navigation/AppNavGraph.kt`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/auth/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/home/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/explore/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/chat/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/trips/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/tools/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/features/account/*`
- Create: `apps/traveler-android/app/src/main/java/com/visepanda/core/designsystem/*`

- [ ] **Step 1: 初始化 Android 项目**

Run: 使用 Android Studio 或 Gradle 创建 Kotlin + Compose 项目到 `apps/traveler-android`
Expected: `./gradlew assembleDebug` 可运行

- [ ] **Step 2: 先接入账号闭环**

实现页面：
- 登录
- 注册
- Account

只在账号闭环跑通后再接内容与行程。

- [ ] **Step 3: 实现内容消费主路径**

实现：
- `Home`
- `Explore`
- `City Detail`
- `Tools`

全部通过 API 获取已发布内容，不直接写死文案。

- [ ] **Step 4: 接入 AI 与行程资产**

实现：
- `Chat`
- 行程保存
- `Trips`

要求：AI 返回结构化结果后可一键保存到行程域。

- [ ] **Step 5: 整体联调**

验证闭环：
`注册登录 -> 浏览内容 -> Chat -> 保存 Trip -> Account 下复访`

- [ ] **Step 6: Commit**

```bash
git add apps/traveler-android
git commit -m "feat: deliver traveler app mvp"
```

## Task 8：实现内容运营后台与管理后台 MVP

**Files:**
- Create: `apps/ops-web/package.json`
- Create: `apps/ops-web/app/*`
- Create: `apps/admin-web/package.json`
- Create: `apps/admin-web/app/*`
- Create: `docs/architecture/backoffice-boundary.md`

- [ ] **Step 1: 初始化两个 Web 应用**

Run:
- `pnpm dlx create-next-app@latest apps/ops-web --ts --app --eslint --src-dir --use-pnpm`
- `pnpm dlx create-next-app@latest apps/admin-web --ts --app --eslint --src-dir --use-pnpm`

Expected: 两个后台应用都能本地启动

- [ ] **Step 2: 运营后台优先实现内容工作流**

实现页面：
- 草稿列表
- 编辑页
- 审核页
- 发布记录页
- 素材上传页

- [ ] **Step 3: 管理后台优先实现权限工作流**

实现页面：
- 管理员登录
- 用户列表
- 用户详情
- 角色与状态修改
- 模型配置权限入口

- [ ] **Step 4: 后台路由守卫**

要求：
- 未登录跳转登录
- 非 `operator` 不可进运营后台
- 非 `admin` 不可进管理后台

- [ ] **Step 5: 联调后台关键动作**

验证：
- 内容从草稿到发布可走通
- 用户角色调整后后台权限立即生效

- [ ] **Step 6: Commit**

```bash
git add apps/ops-web apps/admin-web docs/architecture/backoffice-boundary.md
git commit -m "feat: add ops and admin backoffice mvp"
```

## Task 9：集成测试、发布准备与增强阶段入口

**Files:**
- Create: `.github/workflows/api.yml`
- Create: `.github/workflows/web.yml`
- Create: `.github/workflows/android.yml`
- Create: `docs/runbooks/release.md`
- Create: `docs/runbooks/rollback.md`
- Create: `docs/architecture/enhancement-roadmap.md`

- [ ] **Step 1: 建 CI**

至少包含：
- API 测试
- Web 构建
- Android 构建

- [ ] **Step 2: 定义环境**

区分：
- `local`
- `staging`
- `production`

并为模型配置、对象存储、数据库连接分别设置环境变量。

- [ ] **Step 3: 写发布与回滚 Runbook**

在 `docs/runbooks/release.md` 和 `docs/runbooks/rollback.md` 写清：
- 发布顺序
- 数据迁移顺序
- 模型策略变更回滚方式
- 内容版本回滚方式

- [ ] **Step 4: 做整体验收**

验收清单至少包含：
- 用户注册登录闭环
- 内容发布闭环
- AI 路由闭环
- Trip 资产闭环
- 后台权限隔离闭环

- [ ] **Step 5: 记录增强阶段入口**

在 `docs/architecture/enhancement-roadmap.md` 明确后续增强项：
- 模型灰度
- 内容辅助生成增强
- 数据看板
- 分享协作

- [ ] **Step 6: Commit**

```bash
git add .github docs/runbooks docs/architecture/enhancement-roadmap.md
git commit -m "chore: add ci release runbooks and enhancement roadmap"
```

## 规格覆盖检查

本计划已覆盖设计文档中的核心要求：

- 平台化模块架构：Task 1-2
- 权限域：Task 3
- 内容域：Task 4
- AI 域：Task 5
- 行程域：Task 6
- 游客端 App：Task 7
- 内容运营后台与管理后台：Task 8
- 风险控制、发布和增强路径：Task 9

未纳入首批执行但已预留增强阶段入口的内容：

- 模型灰度
- 内容辅助生成高级工作流
- 分享与协作
- 数据看板增强

## 自检

- 已按独立子系统拆成主工作流，避免一次性混做
- 未使用旧数据库结构
- 任务顺序与依赖关系清晰
- 计划覆盖权限、内容、AI、行程四个核心对象
- 未使用 `TBD`、`TODO`、`implement later` 等占位

## 建议执行顺序

推荐以两周为一个检查周期推进：

1. 第一个周期：Task 1-3
2. 第二个周期：Task 4-6
3. 第三个周期：Task 7-8
4. 第四个周期：Task 9 + 增强阶段入口整理

## 后续子计划建议

如需进入真正编码，建议基于本主计划继续拆 4 份子计划：

1. `visepanda-backend-foundation-plan`
2. `visepanda-ai-orchestration-plan`
3. `visepanda-traveler-app-plan`
4. `visepanda-backoffice-plan`
