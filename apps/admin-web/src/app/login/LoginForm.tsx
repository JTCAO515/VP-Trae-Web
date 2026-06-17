'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AUTH_COOKIE_ACCESS_TOKEN, AUTH_COOKIE_ROLE } from '@/lib/auth';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  requestId: string;
  error?: { code: string; message: string };
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
  user: { id: string; email: string; role: string; status: string };
};

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}`;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => searchParams.get('next') ?? '/users', [searchParams]);

  const [email, setEmail] = useState('admin@visepanda.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 通过同源 Next.js Route Handler 代理到统一 API，避免浏览器跨域/端口不可达问题
  const loginEndpoint = '/api/auth/login';

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">管理后台登录</h1>
        <p className="mt-1 text-sm text-zinc-600">
          MVP Mock 登录：调用 API 的 <code className="rounded bg-zinc-100 px-1">POST /auth/login</code>。
          <br />
          Token 与 role 会写入 <code className="rounded bg-zinc-100 px-1">cookie</code>（非 HttpOnly，仅用于演示）。
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              const res = await fetch(loginEndpoint, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, password }),
              });
              const json = (await res.json()) as ApiEnvelope<LoginResponse>;
              if (!json.success) {
                setError(json.error?.message ?? '登录失败');
                return;
              }

              setCookie(AUTH_COOKIE_ACCESS_TOKEN, json.data.accessToken, json.data.expiresIn);
              setCookie(AUTH_COOKIE_ROLE, json.data.user.role, json.data.expiresIn);
              localStorage.setItem(AUTH_COOKIE_ACCESS_TOKEN, json.data.accessToken);
              localStorage.setItem(AUTH_COOKIE_ROLE, json.data.user.role);

              router.replace(nextPath);
            } catch (err) {
              setError(err instanceof Error ? err.message : '登录失败');
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="block">
            <span className="text-sm text-zinc-700">邮箱</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700">密码</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm">{error}</div> : null}

          <button
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-6 rounded-lg border bg-zinc-50 p-3 text-xs text-zinc-700">
          <div className="font-medium">本地演示账号（由 API 内存态 seed）：</div>
          <div className="mt-1">
            admin：<code>admin@visepanda.local / Admin123!</code>
          </div>
        </div>
      </div>
    </div>
  );
}
