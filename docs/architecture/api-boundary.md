# VisePanda 统一 API 边界说明

## 1. 文档目标

本文档用于明确 `统一 API 工程` 在平台底座阶段的职责边界、契约落点和后续领域模块接入方式，避免游客端、运营后台、管理后台直接绕过 API 操作底层域对象。

当前约束：

- API 工程位于 `/workspace/apps/api`
- OpenAPI 契约位于 `/workspace/packages/openapi/openapi.yaml`
- 共享类型位于 `/workspace/packages/shared-types/src/index.ts`

## 2. API 工程职责

`apps/api` 当前只承担平台接入层职责，不承载具体业务存储逻辑。它负责：

1. 统一 HTTP 入口与应用启动
2. 统一响应信封、请求 ID 和异常输出
3. OpenAPI/Swagger 文档暴露
4. 后续对权限域、内容域、AI 域、行程域的模块装配

它暂时不负责：

- 直接持久化业务数据
- 直接实现 AI 供应商调用
- 直接编写内容发布流和后台权限细则

这些能力会在后续任务中分别进入 `packages/domain-auth`、`packages/domain-content`、`packages/domain-ai`、`packages/domain-trip`。

## 3. 路由边界

### 3.1 已落地底座路由

- `GET /health`：启动探活、部署检查、本地联调入口
- `GET /docs`：Swagger UI
- `GET /openapi.json`
- `GET /openapi.yaml`

### 3.2 已锁定的领域路由前缀

- `Auth`
  - `/auth/register`
  - `/auth/login`
  - `/auth/logout`
  - `/auth/refresh`
- `AdminUsers`
  - `/admin/users`
  - `/admin/users/{id}`
- `Destinations`
  - `/destinations`
  - `/destinations/{id}`
- `Tools`
  - `/tools`
  - `/guides`
- `AI`
  - `/ai/chat`
  - `/ai/tasks/plan-trip`
  - `/ai/models`
  - `/ai/routes`
- `Trips`
  - `/trips`
  - `/trips/{id}`
  - `/trips/{id}/snapshot`

## 4. 响应边界

所有 HTTP 成功/失败响应统一使用 `ApiEnvelope<T>`：

```ts
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  requestId: string;
  error?: {
    code: string;
    message: string;
  };
}
```

约束如下：

1. `requestId` 由 API 接入层生成或透传 `x-request-id`
2. 成功响应由全局拦截器统一封装
3. 失败响应由全局异常过滤器统一封装
4. 领域模块不应各自定义互相冲突的响应格式

## 5. 契约与实现的关系

当前采用“双轨约束”：

1. `packages/openapi/openapi.yaml` 作为跨端可消费的显式契约文件
2. `apps/api` 通过 Nest Swagger 暴露运行时文档入口，方便本地联调

这意味着：

- App/Web 客户端优先以 OpenAPI 文件为集成基准
- API 本地开发优先访问 `/docs` 检查是否成功启动
- 后续若引入客户端生成器，也应基于 `packages/openapi` 而不是手写复制类型

## 6. 共享类型边界

`packages/shared-types` 只放“跨端稳定类型”，当前包括：

- `ApiEnvelope<T>` 与 `ApiError`
- 认证请求/会话响应类型
- 目的地摘要类型
- AI 会话请求/响应类型
- 行程摘要类型

不应放入该包的内容：

- NestJS DTO 装饰器类
- Prisma/Nest 内部实体
- 仅服务端内部使用的仓储或领域对象

## 7. 后续扩展规则

后续接入领域模块时，遵循以下规则：

1. `apps/api` 只做模块装配、鉴权守卫、DTO 校验、响应封装
2. 真正的业务规则下沉到 `packages/domain-*`
3. 每新增公开接口，必须同步更新：
   - `/workspace/packages/openapi/openapi.yaml`
   - `/workspace/packages/shared-types/src/index.ts`（若涉及跨端稳定类型）
   - API 对应控制器/DTO
4. App、运营后台、管理后台不得绕过统一 API 直接访问数据库

## 8. 当前遗留空白

当前 Task 2 只交付平台 API 骨架，尚未实现以下内容：

- 真实注册/登录逻辑
- 内容查询与发布流
- AI 模型编排
- 行程持久化
- 管理后台用户治理

这些空白已在 OpenAPI 中预留路径与基础 schema，后续任务将按领域逐步补齐。
