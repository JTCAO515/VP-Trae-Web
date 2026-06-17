# Backoffice Boundary（内容运营后台 vs 管理后台）

本文件用于明确 `apps/ops-web`（内容运营后台）与 `apps/admin-web`（管理后台）在 MVP 阶段的职责边界与准入规则，避免把权限域/内容域/AI 域的逻辑混在一起。

## 1. 应用定位

### ops-web（内容运营后台）

目标用户：内容运营 / 编辑 / 审核人员（`role=operator`）。

核心关注：
- 内容草稿与编辑
- 审核流转（草稿 -> 审核 -> 发布）
- 发布记录与版本入口
- 素材上传与管理（对象存储）

### admin-web（管理后台）

目标用户：平台管理员（`role=admin`）。

核心关注：
- 用户管理（列表/详情）
- 用户角色与状态管理（禁用/启用）
- AI 模型权限与路由入口（后续对接 AI 域）

## 2. 路由守卫（MVP）

两套后台均实现最小路由守卫：
- 未登录：跳转 `/login`
- ops-web：仅 `operator` 可访问
- admin-web：仅 `admin` 可访问

实现方式（MVP）：
- Web 端调用 `apps/api` 的 `POST /auth/login` 获取会话 `accessToken` 与 `user.role`
- 将 `accessToken` 与 `role` 写入 cookie（**非 HttpOnly，仅用于演示**）
- Next.js middleware 读取 cookie 并做跳转/拒绝

> 说明：MVP 仅验证“是否登录 + 角色是否匹配”。真实环境应使用 HttpOnly cookie、CSRF、防重放，并在服务端校验 token 有效性（`GET /auth/session` 或 JWT 验签）。

## 3. 与后端模块的契约关系（按领域划分）

| 前端 | 依赖后端域 | 典型路径（规划） |
|---|---|---|
| ops-web | 内容域 `domain-content` | `/destinations`、`/tools`、内容版本/审核/发布相关接口（后续补齐） |
| admin-web | 权限域 `domain-auth`、AI 域 `domain-ai` | `AdminUsers`（用户/角色/状态）、模型与路由策略（后续补齐） |

## 4. 本地演示账号（由 AuthService 内存态 seed）

为了让两套后台在 MVP 阶段可以直接登录验证路由守卫，`@visepanda/domain-auth` 会在进程启动时注入两个默认账号：

- operator：`operator@visepanda.local / Operator123!`
- admin：`admin@visepanda.local / Admin123!`

该 seed 仅用于本地开发验证，不代表最终生产策略。

