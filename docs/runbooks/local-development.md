# 本地开发说明

本文档定义当前 VisePanda Web 体系的本地启动方式、依赖准备和推荐开发顺序。

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
   - `API_BASE_URL`（Web 端代理到统一 API 时使用，默认 `http://localhost:3000`）

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

当前建议按以下顺序启动：

1. 本地依赖：PostgreSQL、Redis、MinIO
2. 数据迁移：执行 `infra/migrations` 中的初始化脚本
3. API：`apps/api`
4. 游客前台：`apps/traveler-web`
5. Web 后台：`apps/ops-web` 与 `apps/admin-web`
6. Android：`apps/traveler-android`（仅历史实现参考，不再是主前台）

原因：

- API 负责统一提供鉴权、内容、AI 与行程能力
- `traveler-web`、`ops-web`、`admin-web` 共同依赖统一 API
- `traveler-web` 在非测试环境下会自动读取内容域内存种子，因此启动后就能看到演示内容

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

## 8. 常用启动命令

```bash
pnpm --filter api start:dev
pnpm --filter traveler-web dev
pnpm --filter ops-web dev
pnpm --filter admin-web dev
```

默认端口：

- `api`: `3000`
- `traveler-web`: `3100`
- `ops-web`: `3101`
- `admin-web`: `3102`

说明：

- 当前仓库仅完成 Monorepo 底座初始化，业务子工程会在后续任务中逐步补齐
- 若某子工程尚未加入对应脚本，Turbo 会跳过未声明任务的工作区
