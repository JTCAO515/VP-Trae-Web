# Trip Domain Model

行程域负责把 AI 对话或任务产出的旅行方案沉淀为用户资产，并补充快照、收藏与来源记录。

## 核心对象

- `Trip`：用户名下的主行程对象，包含标题、目的地、日期范围、状态和 AI 摘要
- `TripDay`：行程的日维度结构，保存第几天与当天标题
- `TripItem`：当天的细项安排，保存类型、时间和备注
- `TripSnapshot`：对某一时刻的行程结构做不可变快照
- `Favorite`：用户对 Trip 的收藏关系
- `GenerationRecord`：记录 Trip 来自 `chat` 还是 `task`，以及对应的 `invocation_log_id`

## 访问约束

- 所有 Trip 查询都必须基于当前登录用户过滤
- 读取他人 Trip 返回 `Trip not found`
- 删除 Trip 只影响行程域自身数据，不影响 AI 域中的 invocation log

## API

- `POST /trips`
- `GET /trips`
- `GET /trips/:id`
- `POST /trips/:id/snapshot`
