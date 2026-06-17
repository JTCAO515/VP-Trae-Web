# Traveler Web Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `apps/traveler-web`，把游客端完整闭环迁移到 Web，并采用“游客可浏览，保存时再登录”的策略。

**Architecture:** 采用独立 Next.js App Router 应用承接游客前台，并通过同源 Route Handler 转发到 `apps/api`。内容浏览与 AI 规划默认公开，Trip 资产页和保存动作按路由级/动作级门禁处理，保留现有 `ops-web`、`admin-web` 边界不变。

**Tech Stack:** `Next.js 16`、`React 19`、`TypeScript 5`、`Tailwind CSS 4`、`NestJS API`、`pnpm` Monorepo、`ESLint`

---

## 文件结构

### 新建应用

- Create: `apps/traveler-web/package.json`
- Create: `apps/traveler-web/tsconfig.json`
- Create: `apps/traveler-web/eslint.config.mjs`
- Create: `apps/traveler-web/postcss.config.mjs`
- Create: `apps/traveler-web/next.config.js`
- Create: `apps/traveler-web/next-env.d.ts`
- Create: `apps/traveler-web/.gitignore`
- Create: `apps/traveler-web/src/app/layout.tsx`
- Create: `apps/traveler-web/src/app/globals.css`
- Create: `apps/traveler-web/src/app/page.tsx`

### 路由页面

- Create: `apps/traveler-web/src/app/destinations/page.tsx`
- Create: `apps/traveler-web/src/app/destinations/[id]/page.tsx`
- Create: `apps/traveler-web/src/app/tools/page.tsx`
- Create: `apps/traveler-web/src/app/ai/plan-trip/page.tsx`
- Create: `apps/traveler-web/src/app/login/page.tsx`
- Create: `apps/traveler-web/src/app/trips/page.tsx`
- Create: `apps/traveler-web/src/app/trips/[id]/page.tsx`

### 同源 API 代理

- Create: `apps/traveler-web/src/app/api/auth/login/route.ts`
- Create: `apps/traveler-web/src/app/api/auth/register/route.ts`
- Create: `apps/traveler-web/src/app/api/destinations/route.ts`
- Create: `apps/traveler-web/src/app/api/destinations/[id]/route.ts`
- Create: `apps/traveler-web/src/app/api/tools/route.ts`
- Create: `apps/traveler-web/src/app/api/ai/plan-trip/route.ts`
- Create: `apps/traveler-web/src/app/api/trips/route.ts`
- Create: `apps/traveler-web/src/app/api/trips/[id]/route.ts`

### 共享组件与工具

- Create: `apps/traveler-web/src/components/AppHeader.tsx`
- Create: `apps/traveler-web/src/components/PageContainer.tsx`
- Create: `apps/traveler-web/src/components/LoginForm.tsx`
- Create: `apps/traveler-web/src/components/ActionGuardButton.tsx`
- Create: `apps/traveler-web/src/lib/auth.ts`
- Create: `apps/traveler-web/src/lib/api.ts`
- Create: `apps/traveler-web/src/lib/guards.ts`
- Create: `apps/traveler-web/src/lib/pending-action.ts`

### 文档

- Modify: `docs/runbooks/local-development.md`
- Modify: `docs/architecture/repo-structure.md`

## Task 1: Scaffold `traveler-web`

**Files:**
- Create: `apps/traveler-web/package.json`
- Create: `apps/traveler-web/tsconfig.json`
- Create: `apps/traveler-web/eslint.config.mjs`
- Create: `apps/traveler-web/postcss.config.mjs`
- Create: `apps/traveler-web/next.config.js`
- Create: `apps/traveler-web/next-env.d.ts`
- Create: `apps/traveler-web/.gitignore`
- Create: `apps/traveler-web/src/app/layout.tsx`
- Create: `apps/traveler-web/src/app/globals.css`
- Create: `apps/traveler-web/src/app/page.tsx`

- [ ] **Step 1: 创建应用目录与基础文件**

```bash
mkdir -p apps/traveler-web/src/app
touch apps/traveler-web/{package.json,tsconfig.json,eslint.config.mjs,postcss.config.mjs,next.config.js,next-env.d.ts,.gitignore}
touch apps/traveler-web/src/app/{layout.tsx,globals.css,page.tsx}
```

- [ ] **Step 2: 写入 `apps/traveler-web/package.json`**

```json
{
  "name": "traveler-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "next build",
    "start": "next start -p 3100",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3: 对齐 `tsconfig.json` 与 `next.config.js`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '10.2.94.54',
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
  ],
};

module.exports = nextConfig;
```

- [ ] **Step 4: 建立基础 Layout 与首页**

```tsx
import './globals.css';

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{props.children}</body>
    </html>
  );
}
```

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900">VisePanda 游客前台</h1>
      <p className="mt-2 text-sm text-zinc-600">游客可浏览内容，保存时再登录。</p>
    </main>
  );
}
```

- [ ] **Step 5: 运行安装与基础构建**

Run: `pnpm install && pnpm --filter traveler-web build`
Expected: `traveler-web` 成功构建，首页可产出 `.next`

- [ ] **Step 6: Commit**

```bash
git add apps/traveler-web package.json pnpm-lock.yaml
git commit -m "feat: scaffold traveler web app"
```

## Task 2: Add public traveler shell and content pages

**Files:**
- Create: `apps/traveler-web/src/components/AppHeader.tsx`
- Create: `apps/traveler-web/src/components/PageContainer.tsx`
- Create: `apps/traveler-web/src/lib/api.ts`
- Create: `apps/traveler-web/src/app/destinations/page.tsx`
- Create: `apps/traveler-web/src/app/destinations/[id]/page.tsx`
- Create: `apps/traveler-web/src/app/tools/page.tsx`
- Create: `apps/traveler-web/src/app/api/destinations/route.ts`
- Create: `apps/traveler-web/src/app/api/destinations/[id]/route.ts`
- Create: `apps/traveler-web/src/app/api/tools/route.ts`

- [ ] **Step 1: 写公共容器组件**

```tsx
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-zinc-900">
          VisePanda · Traveler Web
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          <Link href="/destinations">目的地</Link>
          <Link href="/tools">工具</Link>
          <Link href="/ai/plan-trip">AI 规划</Link>
          <Link href="/trips">我的行程</Link>
        </nav>
      </div>
    </header>
  );
}
```

```tsx
import { AppHeader } from '@/components/AppHeader';

export function PageContainer(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">{props.title}</h1>
        {props.children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 写同源转发工具 `src/lib/api.ts`**

```ts
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

export async function proxyJson(path: string, init?: RequestInit) {
  const upstream = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
    },
  });
}
```

- [ ] **Step 3: 写内容代理路由**

```ts
import { proxyJson } from '@/lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale');
  return proxyJson(`/destinations${locale ? `?locale=${locale}` : ''}`, { method: 'GET' });
}
```

```ts
import { proxyJson } from '@/lib/api';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyJson(`/destinations/${id}`, { method: 'GET' });
}
```

```ts
import { proxyJson } from '@/lib/api';

export async function GET() {
  return proxyJson('/tools', { method: 'GET' });
}
```

- [ ] **Step 4: 写公开页面**

```tsx
import Link from 'next/link';
import { PageContainer } from '@/components/PageContainer';

export default async function DestinationsPage() {
  const res = await fetch('http://localhost:3100/api/destinations?locale=zh-CN', { cache: 'no-store' });
  const payload = await res.json();

  return (
    <PageContainer title="目的地">
      <div className="space-y-3">
        {payload.data.map((item: { id: string; name: string; summary: string }) => (
          <Link key={item.id} href={`/destinations/${item.id}`} className="block rounded-lg border bg-white p-4">
            <h2 className="font-medium">{item.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">{item.summary}</p>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
```

- [ ] **Step 5: 构建验证公开页**

Run: `pnpm --filter traveler-web build`
Expected: `/`, `/destinations`, `/destinations/[id]`, `/tools` 页面通过编译

- [ ] **Step 6: Commit**

```bash
git add apps/traveler-web/src/components apps/traveler-web/src/app apps/traveler-web/src/lib
git commit -m "feat: add traveler public content pages"
```

## Task 3: Add login/register flow and pending action recovery

**Files:**
- Create: `apps/traveler-web/src/lib/auth.ts`
- Create: `apps/traveler-web/src/lib/pending-action.ts`
- Create: `apps/traveler-web/src/components/LoginForm.tsx`
- Create: `apps/traveler-web/src/app/login/page.tsx`
- Create: `apps/traveler-web/src/app/api/auth/login/route.ts`
- Create: `apps/traveler-web/src/app/api/auth/register/route.ts`

- [ ] **Step 1: 定义 cookie 与待执行动作协议**

```ts
export const AUTH_COOKIE_ACCESS_TOKEN = 'vp_access_token';
export const AUTH_COOKIE_ROLE = 'vp_role';

export type PendingAction = {
  type: 'save-trip';
  redirectTo: string;
  payload: string;
};
```

- [ ] **Step 2: 写待执行动作读写函数**

```ts
export const PENDING_ACTION_KEY = 'vp_pending_action';

export function writePendingAction(action: PendingAction) {
  sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
}

export function readPendingAction(): PendingAction | null {
  const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
  return raw ? (JSON.parse(raw) as PendingAction) : null;
}

export function clearPendingAction() {
  sessionStorage.removeItem(PENDING_ACTION_KEY);
}
```

- [ ] **Step 3: 写登录代理与表单**

```ts
import { proxyJson } from '@/lib/api';

export async function POST(req: Request) {
  const body = await req.text();
  return proxyJson('/auth/login', {
    method: 'POST',
    body,
  });
}
```

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(path: '/api/auth/login' | '/api/auth/register') {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = await res.json();
    if (!res.ok || payload.success === false) {
      setError(payload.error?.message ?? '登录失败');
      return;
    }
    router.push(searchParams.get('redirect') ?? '/trips');
  }

  return null;
}
```

- [ ] **Step 4: 写登录页**

```tsx
import { PageContainer } from '@/components/PageContainer';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <PageContainer title="登录或注册">
      <LoginForm />
    </PageContainer>
  );
}
```

- [ ] **Step 5: 构建验证登录路由**

Run: `pnpm --filter traveler-web build`
Expected: `/login` 和 `/api/auth/login`、`/api/auth/register` 编译通过

- [ ] **Step 6: Commit**

```bash
git add apps/traveler-web/src/app/login apps/traveler-web/src/app/api/auth apps/traveler-web/src/lib apps/traveler-web/src/components/LoginForm.tsx
git commit -m "feat: add traveler auth flow and pending action support"
```

## Task 4: Add AI trip planning with save guard

**Files:**
- Create: `apps/traveler-web/src/components/ActionGuardButton.tsx`
- Create: `apps/traveler-web/src/app/ai/plan-trip/page.tsx`
- Create: `apps/traveler-web/src/app/api/ai/plan-trip/route.ts`

- [ ] **Step 1: 写 AI 规划代理路由**

```ts
import { proxyJson } from '@/lib/api';

export async function POST(req: Request) {
  return proxyJson('/ai/tasks/plan-trip', {
    method: 'POST',
    body: await req.text(),
  });
}
```

- [ ] **Step 2: 写动作级门禁按钮**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { writePendingAction } from '@/lib/pending-action';

export function ActionGuardButton(props: {
  isAuthenticated: boolean;
  actionPayload: string;
  redirectTo: string;
  onAuthorized: () => void;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (props.isAuthenticated) {
          props.onAuthorized();
          return;
        }
        writePendingAction({ type: 'save-trip', payload: props.actionPayload, redirectTo: props.redirectTo });
        router.push(`/login?redirect=${encodeURIComponent(props.redirectTo)}`);
      }}
    >
      保存为 Trip
    </button>
  );
}
```

- [ ] **Step 3: 写 AI 规划页面**

```tsx
import { PageContainer } from '@/components/PageContainer';

export default function PlanTripPage() {
  return (
    <PageContainer title="AI 行程规划">
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-zinc-600">输入目的地、天数和兴趣，生成可保存的行程结果。</p>
      </div>
    </PageContainer>
  );
}
```

- [ ] **Step 4: 补上保存按钮联动**

```tsx
<ActionGuardButton
  isAuthenticated={Boolean(accessToken)}
  redirectTo="/ai/plan-trip"
  actionPayload={JSON.stringify({ destination, days, aiResult })}
  onAuthorized={() => submitCreateTrip() }
/>
```

- [ ] **Step 5: 构建验证 AI 页**

Run: `pnpm --filter traveler-web build`
Expected: `/ai/plan-trip` 编译通过，AI 代理路由通过类型检查

- [ ] **Step 6: Commit**

```bash
git add apps/traveler-web/src/app/ai apps/traveler-web/src/components/ActionGuardButton.tsx apps/traveler-web/src/app/api/ai/plan-trip
git commit -m "feat: add ai trip planning page with save guard"
```

## Task 5: Add protected trips pages

**Files:**
- Create: `apps/traveler-web/src/lib/guards.ts`
- Create: `apps/traveler-web/src/app/api/trips/route.ts`
- Create: `apps/traveler-web/src/app/api/trips/[id]/route.ts`
- Create: `apps/traveler-web/src/app/trips/page.tsx`
- Create: `apps/traveler-web/src/app/trips/[id]/page.tsx`

- [ ] **Step 1: 写服务器端鉴权守卫**

```ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_ACCESS_TOKEN } from '@/lib/auth';

export async function requireTravelerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_ACCESS_TOKEN)?.value;
  if (!token) {
    redirect('/login?redirect=/trips');
  }
  return token;
}
```

- [ ] **Step 2: 写带 token 的 Trip 代理**

```ts
import { cookies } from 'next/headers';
import { proxyJson } from '@/lib/api';
import { AUTH_COOKIE_ACCESS_TOKEN } from '@/lib/auth';

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_ACCESS_TOKEN)?.value ?? '';
  return proxyJson('/trips', {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });
}
```

- [ ] **Step 3: 写行程列表页**

```tsx
import { requireTravelerSession } from '@/lib/guards';
import { PageContainer } from '@/components/PageContainer';

export default async function TripsPage() {
  await requireTravelerSession();
  const res = await fetch('http://localhost:3100/api/trips', { cache: 'no-store' });
  const payload = await res.json();

  return (
    <PageContainer title="我的行程">
      <div className="space-y-3">
        {payload.data.map((trip: { id: string; title: string; destination: string }) => (
          <a key={trip.id} href={`/trips/${trip.id}`} className="block rounded-lg border bg-white p-4">
            <h2 className="font-medium">{trip.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{trip.destination}</p>
          </a>
        ))}
      </div>
    </PageContainer>
  );
}
```

- [ ] **Step 4: 写行程详情页**

```tsx
import { requireTravelerSession } from '@/lib/guards';
import { PageContainer } from '@/components/PageContainer';

export default async function TripDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireTravelerSession();
  const { id } = await props.params;
  const res = await fetch(`http://localhost:3100/api/trips/${id}`, { cache: 'no-store' });
  const payload = await res.json();

  return (
    <PageContainer title={payload.data.title}>
      <pre className="overflow-auto rounded-lg border bg-white p-4 text-xs">{JSON.stringify(payload.data, null, 2)}</pre>
    </PageContainer>
  );
}
```

- [ ] **Step 5: 构建验证受保护路由**

Run: `pnpm --filter traveler-web build`
Expected: `/trips` 与 `/trips/[id]` 编译通过，未登录访问时可跳转登录

- [ ] **Step 6: Commit**

```bash
git add apps/traveler-web/src/lib/guards.ts apps/traveler-web/src/app/api/trips apps/traveler-web/src/app/trips
git commit -m "feat: add protected traveler trips pages"
```

## Task 6: Update docs and verify local workflow

**Files:**
- Modify: `docs/runbooks/local-development.md`
- Modify: `docs/architecture/repo-structure.md`
- Modify: `package.json`

- [ ] **Step 1: 更新仓库结构文档**

```md
- `apps/traveler-web`：游客前台 Web，负责内容浏览、AI 行程规划、Trip 保存与查看
```

- [ ] **Step 2: 更新本地开发说明**

```md
启动顺序建议：
1. `pnpm --filter api start:dev`
2. `pnpm --filter traveler-web dev`
3. `pnpm --filter ops-web dev`
4. `pnpm --filter admin-web dev`
```

- [ ] **Step 3: 验证核心命令**

Run: `pnpm --filter traveler-web lint && pnpm --filter traveler-web build`
Expected: `lint` 和 `build` 全部通过

- [ ] **Step 4: 验证前后台并存**

Run: `pnpm --filter api start:dev & pnpm --filter traveler-web dev & pnpm --filter ops-web dev & pnpm --filter admin-web dev`
Expected: 四个服务可同时启动，端口分别为 `3000`、`3100`、`3101`、`3102`

- [ ] **Step 5: Commit**

```bash
git add docs/runbooks/local-development.md docs/architecture/repo-structure.md
git commit -m "docs: document traveler web workflow"
```

## 自检

- 规格覆盖：
  - `traveler-web` 新应用：Task 1
  - 内容浏览：Task 2
  - 保存时登录：Task 3 + Task 4
  - AI 规划：Task 4
  - Trip 列表/详情：Task 5
  - 文档与启动方式：Task 6
- 无 `TBD`、`TODO`、`implement later` 占位
- 文件路径、端口与现有应用保持一致

