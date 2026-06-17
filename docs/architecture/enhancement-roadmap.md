# 增强阶段入口与路线图（Enhancement Roadmap）

本文档用于在完成 MVP（Task 1-9）后，明确“增强阶段”的进入条件、优先级与演进路线，避免在首版闭环未稳时过早扩展范围。

## 1. 进入增强阶段的准入条件（Gate）

当满足以下条件时，允许进入增强阶段迭代：

1. **CI 稳定**
   - API / Web / Android 的 workflow 均可稳定执行
2. **核心闭环验收通过**
   - 用户注册登录闭环
   - 内容发布闭环
   - AI 路由闭环
   - Trip 资产闭环
   - 后台权限隔离闭环
3. **发布与回滚手册可用**
   - 已按 `docs/runbooks/release.md` 与 `docs/runbooks/rollback.md` 完成至少 1 次 staging 演练
4. **环境区分明确**
   - local / staging / production 的变量与密钥体系已落地（参考根目录 `.env.example`）

## 2. 路线图总览（按优先级）

> 约定：增强阶段的落地应尽量通过“可回滚”的方式实现（策略版本化、feature flag、灰度放量、可观测性与审计）。

### P0：模型灰度（Model Canary & Rollout）

目标：
- 允许 **按租户/用户段/百分比** 灰度启用新模型或新 prompt
- 异常时可一键切回“上一稳定策略”

建议实现：
- 将 `domain-ai` 的 `ModelProfile / RoutePolicy / PromptTemplate` 从内存初始化迁移到 **DB 持久化**
- 策略表增加：
  - `isActive` / `version` / `effectiveAt` / `createdBy`
  - 灰度规则（用户段、比例、白名单）
- API 增强：
  - `GET /ai/routes` 增加策略版本与生效范围
  - 新增管理端接口（仅 Admin/Ops 可用）用于发布/回滚策略版本

关键风险：
- 灰度逻辑与缓存一致性（避免“同一请求链路命中不同策略”）
- provider 失败时的降级与限流策略

### P0：内容辅助生成增强（Content Assist 2.0）

目标：
- 内容草稿支持 AI 辅助生成（摘要/亮点/结构化段落）
- 生成结果可审阅、可追溯、可回滚

建议实现：
- 在 `domain-content` 侧引入“生成记录”对象：
  - prompt、命中模型、输出摘要、操作者、时间戳
- 结合 `domain-ai` 的路由策略，为内容生成定义独立 taskType（如 `content_copywriting`）
- Ops Web 增强工作流：
  - 一键生成 → 人工编辑 → 审核 → 发布

### P1：数据看板（运营/管理 Dashboard）

目标：
- 将 AI 调用、内容发布、Trip 保存等关键指标可视化

建议实现：
- 先从“日志落库 + 简单聚合”开始：
  - AI invocation log 落库（或接入可观测平台）
  - 内容发布事件与版本变更事件落库
- Admin Web 新增看板页面：
  - 日/周调用量、失败率、fallback 使用率
  - 内容发布量、回滚次数
  - Trip 创建/保存/分享趋势

### P1：分享协作（Sharing & Collaboration）

目标：
- Trip 支持分享链接/协作编辑/评论（逐步增强）

建议实现：
- Trip 资产对象扩展：
  - `shareToken`、`visibility`（private/unlisted/public）
  - 协作者（role: owner/editor/viewer）
- 权限域扩展：
  - 协作权限与审计日志

## 3. 推荐交付节奏（示例）

1. Sprint A（2 周）：模型策略落库 + 策略版本化 + staging 灰度
2. Sprint B（2 周）：内容辅助生成（最小闭环）+ 生成记录审计
3. Sprint C（2 周）：数据看板 MVP（关键指标 3-5 个）
4. Sprint D（2 周）：Trip 分享（unlisted link）+ 最小协作模型

## 4. 工程治理建议

- 统一 feature flag 体系（建议：DB 配置 + 内存缓存 + 管理端界面）
- 所有“可运营策略”（AI 路由/Prompt/灰度规则）都必须：
  - 可审计（谁改的、什么时候改的、影响面）
  - 可回滚（上一版本指针）
  - 可演练（staging 必须先演练）

