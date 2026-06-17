# 回滚 Runbook（staging / production）

本文档描述 VisePanda 平台在发布异常时的回滚策略与操作顺序，重点覆盖：
- 发布顺序的逆序回滚建议
- 数据迁移回滚策略
- **模型策略变更** 的回滚方式
- **内容版本** 的回滚方式

## 0. 回滚原则

1. **先止血，再定位**
   - 优先恢复用户可用性（回滚前端/配置/路由），再追根因。
2. **数据库优先“向前修复”，慎做结构回滚**
   - 结构性回滚风险高（数据丢失、依赖错配），推荐通过“向前兼容迁移 + 向前修复”降低需要 DB 回滚的概率。
3. **API 与 Web 的兼容性**
   - 若 API 与 Web 存在契约变更，回滚需保证版本匹配（尽量回滚到同一个 git tag 产物）。

## 1. 回滚顺序（建议）

按“影响面最小 → 最大”的顺序：

1. **配置回滚**（环境变量/路由/feature flag）
2. **Web 回滚**（ops-web / admin-web）
3. **API 回滚**（apps/api）
4. **数据库回滚**（仅在必要时，且必须评估数据影响）
5. **Android 回滚**
   - 若已发布到外部渠道，通常无法“强制回滚”，而是发布一个修复版本（hotfix）。

## 2. 数据库迁移回滚

当前迁移位于 `/workspace/infra/migrations/`，默认只有“向前”脚本。

建议策略：
- 任何破坏性变更（删列/改类型）上线前必须提供：
  - 可逆脚本（建议落在 `infra/migrations/rollback/`，后续可补齐目录）
  - 或“兼容窗口”（先双写/保留旧字段，后续再清理）

最低要求（当必须回滚时）：
- 明确回滚目标（回到哪个 tag / 哪个 schema 版本）
- 明确是否会丢数据、丢哪些数据
- 先在 staging 演练通过后再对 production 执行

## 3. 模型策略变更回滚（AI Routing）

### 3.1 可回滚的变更类型

- routePolicy → primary/fallback 模型链路调整
- promptTemplateVersion 切换（如 `travel-chat@v1` ↔ `travel-chat@v2`）
- provider 切换（如 OpenAI → Anthropic）

### 3.2 当前实现的现实约束（重要）

当前 `domain-ai` 将模型与路由策略以 **内存数据** 初始化（见 `/workspace/packages/domain-ai/src/ai-orchestrator.service.ts`），并未提供“运行时修改”接口。

因此，当前阶段的回滚方式为：
- **回滚到上一版本代码产物（git tag / 上一次成功构建产物）** 并重新部署 API

### 3.3 进入增强阶段后的推荐做法（TODO）

当路由策略进入 DB/配置中心托管后，建议支持：
- 以“策略版本号”管理 routePolicy（只切换 active 版本即可回滚）
- 以“灰度比例/租户/用户段”进行放量（异常时把比例降到 0）
- 为每次策略变更记录审计日志与回滚指针

## 4. 内容版本回滚（Content）

### 4.1 回滚对象

以“目的地内容（Destination）”为例，发布/回滚能力已内置（见 `/workspace/packages/domain-content/src/content.service.ts`）。

### 4.2 回滚方式（API 调用）

#### 方式 A：回滚到上一条已发布版本

```bash
curl -X POST "$API_BASE_URL/content/destinations/<DESTINATION_ID>/rollback" \
  -H "Content-Type: application/json" \
  -d "{}"
```

#### 方式 B：回滚到指定发布版本号

```bash
curl -X POST "$API_BASE_URL/content/destinations/<DESTINATION_ID>/rollback" \
  -H "Content-Type: application/json" \
  -d '{"versionNo": 2}'
```

验证点：
- `publishedVersionNo` 指向新的回滚版本
- 对外读接口（`GET /destinations`、`GET /destinations/:id`）返回的内容已变更

> TODO：ToolGuide 目前未暴露 rollback endpoint（仅提供 publish/list），如需要一致的内容回滚能力，可在后续补齐。

