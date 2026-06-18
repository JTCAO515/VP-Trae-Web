# VisePanda Monorepo 结构说明

本文档描述平台首阶段采用的单仓结构与职责边界，作为后续 API、后台与 Android 工程落位依据。

## 顶层目录

```text
/workspace
├── apps
│   ├── admin-web
│   ├── api
│   ├── ops-web
│   ├── traveler-web
│   └── traveler-android
├── packages
│   ├── domain-ai
│   ├── domain-auth
│   ├── domain-content
│   ├── domain-trip
│   ├── openapi
│   ├── shared-config
│   └── shared-types
├── infra
│   ├── docker
│   └── migrations
└── docs
    ├── architecture
    └── runbooks
```

## 目录职责

### `apps/`

- `api`：统一 API / BFF 工程
- `ops-web`：内容运营后台
- `admin-web`：管理后台
- `traveler-web`：游客前台 Web，承接内容浏览、AI 规划与 Trip 资产页
- `traveler-android`：游客端 Android App

### `packages/`

- `domain-auth`：认证、角色、会话与权限
- `domain-content`：目的地、工具内容、发布流
- `domain-ai`：模型编排、路由策略、提示词模板
- `domain-trip`：行程实体、快照与用户资产
- `shared-types`：跨端共享类型定义
- `shared-config`：统一环境与配置装载
- `openapi`：契约、Schema 与客户端生成入口

### `infra/`

- `docker`：本地 PostgreSQL / Redis / 对象存储依赖
- `migrations`：数据库迁移、种子与回滚脚本

### `docs/`

- `architecture`：系统边界、数据模型、接口边界文档
- `runbooks`：本地开发、部署、回滚与运维说明

## 工程约束

1. 根目录只放工作区与工程级配置，不放业务实现
2. 跨应用共享逻辑优先进入 `packages/`，避免复制粘贴
3. 领域包按业务边界拆分，避免出现巨型 `shared` 杂包
4. API 先稳定契约，再由 `traveler-web`、后台与 App 消费

## 当前状态

当前 Task 1 已完成目录底座、工作区配置、本地依赖编排和开发说明初始化，后续任务将在上述目录内逐步填充实际实现。
