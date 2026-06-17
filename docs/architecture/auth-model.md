# 权限域与账号闭环模型

## 核心表

- `/workspace/infra/migrations/001_auth_init.sql` 创建 `users`、`roles`、`user_roles`、`sessions`、`profiles`
- 账号首批状态使用 `active`、`disabled`
- 首批角色内置 `traveler`、`operator`、`admin`

## 运行时最小实现

- `@visepanda/domain-auth` 以 `AuthService` 管理内存态用户、角色、会话、Profile 与占位 token
- `apps/api` 通过 `AuthModule` 暴露以下接口：
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/session`
  - `POST /auth/email-verification/request`
  - `POST /auth/email-verification/confirm`
  - `POST /auth/password-reset/request`
  - `POST /auth/password-reset/confirm`

## 闭环说明

1. 注册时创建用户、Profile、`traveler` 角色绑定和首个会话
2. 登录时校验邮箱、密码与账号状态，并新建会话
3. 登出时撤销当前 Bearer 会话
4. 会话校验只接受未撤销且未过期的 Bearer token
5. 邮箱验证/重置密码先使用占位 token，完成生成、消费和状态从 `pending` 到 `used` 的迁移
