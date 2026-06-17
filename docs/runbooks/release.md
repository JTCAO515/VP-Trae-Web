# 发布 Runbook（staging / production）

本文档用于指导 VisePanda 平台在 **预发布（staging）** 与 **生产（production）** 的发布操作，覆盖发布顺序、数据库迁移顺序以及发布后的基础验证。

> 说明：当前仓库尚未绑定具体云厂商与 IaC（K8s / Terraform / Helm 等）。本文以“命令/顺序/验证点”为主，部署载体（Docker、K8s、PaaS）请按实际落地替换。

## 0. 发布前检查（Preflight）

1. **代码冻结**
   - 合并到 `main` 的变更需通过 Code Review。
2. **CI 通过**
   - GitHub Actions：`api` / `web` / `android`（Android 若暂未接入签名也应至少能 assembleDebug）。
3. **环境变量确认**
   - 参考根目录 `/workspace/.env.example`。
   - staging 与 production 必须使用独立的 DB / Redis / S3 Bucket 与密钥。
4. **迁移策略确认**
   - 默认原则：**优先做“向前兼容”的迁移**（加字段/加表）以降低回滚成本。
   - 若包含破坏性变更（删列/改类型），必须补齐可执行的回滚方案（见 `docs/runbooks/rollback.md`）。

## 1. 发布顺序（推荐）

### 1.1 数据库迁移（必须先于 API）

当前迁移脚本位于 `/workspace/infra/migrations/`，按文件前缀递增执行。

示例（以 psql 为例）：

```bash
psql "$DATABASE_URL" -f infra/migrations/001_auth_init.sql
psql "$DATABASE_URL" -f infra/migrations/002_content_init.sql
psql "$DATABASE_URL" -f infra/migrations/003_ai_init.sql
psql "$DATABASE_URL" -f infra/migrations/004_trip_init.sql
```

验证点：
- 迁移执行无报错
- 新表/索引符合预期

### 1.2 发布 API（apps/api）

建议在 staging 先发布并完成验收后，再进入 production。

最低发布动作（以“构建 + 启动”为例）：

```bash
pnpm install --frozen-lockfile
pnpm --filter api build
node apps/api/dist/main.js
```

验证点（必须）：
- `GET /health` 返回 `success=true`
- `GET /docs`（Swagger UI）可打开（若暴露）

### 1.3 发布 Web 后台（apps/ops-web, apps/admin-web）

构建命令：

```bash
pnpm install --frozen-lockfile
pnpm --filter ops-web build
pnpm --filter admin-web build
```

验证点：
- Ops Web 与 Admin Web 能加载并通过基础导航
- 与 API 的连通性通过（如已接入 BFF/鉴权）

### 1.4 发布 Android（apps/traveler-android）

当前仓库已提供可运行的 Debug 构建入口：

```bash
cd apps/traveler-android
./gradlew test
./gradlew :app:assembleDebug
```

发布到分发渠道（TODO）：
- 补齐 keystore 与 signingConfig（通过 CI secrets 注入）
- 使用 `bundleRelease` 产出 AAB 并上传到 Play Console / 内部分发平台

## 2. 发布后验收（最小 Smoke Test）

> 与 master plan Task 9 的“整体验收”对齐，这里只列出发布后最小验证点，完整验收清单建议由 QA/产品另行维护。

- 用户注册登录闭环（Auth）
- 内容发布闭环（Content）
- AI 路由闭环（AI）
- Trip 资产闭环（Trips）
- 后台权限隔离闭环（Admin/Ops）

## 3. 变更记录与版本管理

推荐实践：
- 对外发布（staging/prod）以 **git tag** 作为版本基线（例如 `v0.1.0`）
- 发布工单/说明中记录：
  - tag
  - 迁移版本（最后一个 migration 文件名）
  - 环境变量变更（尤其是 AI provider / S3 bucket / 连接串）

