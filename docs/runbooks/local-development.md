# 本地开发说明

本文档定义 VisePanda 平台底座阶段的本地启动方式、依赖准备和推荐开发顺序。

## 1. 前置要求

- Node.js 20+
- pnpm 10+
- Docker 与 Docker Compose
- 可选：`psql` 用于手动执行 SQL 迁移

## 2. 初始化工程

在仓库根目录执行：

```bash
pnpm install
```

该命令会安装根工作区开发依赖，并校验 `pnpm-workspace.yaml` 是否可正常解析。

## 3. 环境变量

1. 复制根目录样例文件：

```bash
cp .env.example .env
```

2. 按本机环境调整以下变量：
   - `DATABASE_URL`
   - `REDIS_URL`
   - `S3_ENDPOINT`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`

## 4. 启动本地基础依赖

```bash
pnpm docker:up
```

停止并清理依赖：

```bash
pnpm docker:down
```

在修改 Compose 配置后，可先执行：

```bash
pnpm docker:check
```

## 5. 推荐启动顺序

当前阶段应用尚未初始化完成，后续任务落地时按以下顺序启动：

1. 本地依赖：PostgreSQL、Redis、MinIO
2. 数据迁移：执行 `infra/migrations` 中的初始化脚本
3. API：`apps/api`
4. Web 后台：`apps/ops-web` 与 `apps/admin-web`
5. Android：`apps/traveler-android`

原因：

- API 负责统一提供鉴权、内容、AI 与行程能力
- Web 与 Android 依赖 API 契约和本地基础数据

## 6. 数据迁移入口

在正式迁移工具接入前，先使用 SQL 文件作为入口。示例：

```bash
psql "$DATABASE_URL" -f infra/migrations/001_auth_init.sql
```

后续若接入 Prisma 或 NestJS CLI 脚本，应继续保留本文件作为统一入口说明。

## 7. 常见开发动作

```bash
pnpm lint
pnpm test
pnpm build
```

说明：

- 当前仓库仅完成 Monorepo 底座初始化，业务子工程会在后续任务中逐步补齐
- 若某子工程尚未加入对应脚本，Turbo 会跳过未声明任务的工作区
