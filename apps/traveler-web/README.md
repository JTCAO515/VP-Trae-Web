# traveler-web

`traveler-web` 是 VisePanda 的游客前台 Web 应用，负责承接游客浏览与行程资产化主链路。

当前已支持：

- 首页游客落地页
- 目的地列表与详情
- 工具列表与详情
- AI 行程规划
- 保存时登录
- 我的行程列表与详情
- Trip 快照创建

## 本地启动

在仓库根目录执行：

```bash
pnpm install
pnpm --filter api start:dev
pnpm --filter traveler-web dev
```

默认端口：

- `api`: `http://localhost:3000`
- `traveler-web`: `http://localhost:3100`

## 说明

- 默认会使用 `apps/api` 提供的内存态内容与账号能力
- 当 `VP_ENABLE_CONTENT_SEED=1` 或在非测试环境运行时，内容域会自动注入一批游客端演示内容
- 游客浏览内容与使用 AI 规划不需要先登录
- 保存 Trip 或访问 `/trips` 时会进入登录/注册流程
