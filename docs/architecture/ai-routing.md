# AI 编排域与多模型路由

## 目标

Task 5 在统一 API 中补齐 AI 编排域最小闭环：

- 按任务类型做模型路由
- 支持主模型失败后的降级链
- 支持提示词模板版本选择
- 记录调用日志
- 暴露 `/ai/chat`、`/ai/tasks/plan-trip`、`/ai/models`、`/ai/routes`

## 组成

### domain-ai 包

- `AIOrchestratorService`：负责任务解析、模型选择、提示词构建、Provider 调用与日志记录
- `AIController`：暴露 AI 相关 HTTP 接口
- `providers/provider.interface.ts`：定义 Provider 统一调用契约
- `providers/mock.provider.ts`：当前阶段的假 Provider，便于先跑通 TDD 与 API 契约

### 核心配置对象

- `TaskTypeEntity`：任务类型定义，当前包含 `chat_travel_advice`、`trip_planning`
- `ModelProfileEntity`：模型配置，描述 provider、模型名称、能力、优先级
- `RoutePolicyEntity`：任务到模型链路的路由规则
- `PromptTemplateEntity`：按任务类型与版本管理模板
- `InvocationLogEntity`：记录本次调用的尝试链路、最终命中模型与结果

## 路由规则

### chat_travel_advice

- 路由名：`chat_travel_advice.default`
- 主模型：`model-chat-primary`
- Provider：`mock-openai`
- 默认模板：`travel-chat@v1`

### trip_planning

- 路由名：`trip_planning.default`
- 主模型：`model-trip-primary`
- 降级模型：`model-trip-fallback`
- 默认模板：`trip-plan@v1`

## 降级策略

当前 mock 实现中：

- `mock-google` 在 prompt 包含“故障演练”时主动抛错
- 编排服务会继续尝试 fallback 链
- 最终返回 `fallbackUsed=true` 和 `attemptCount`

## 日志策略

每次调用都记录：

- 任务类型
- 路由策略
- 模板版本
- 实际命中模型
- 所有尝试记录
- 请求与响应摘要

首版先采用内存日志与 SQL 迁移占位，后续再接入真实数据库与可观测性系统。
