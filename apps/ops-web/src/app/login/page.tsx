import { Suspense } from 'react';

import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-zinc-50 px-4 py-16 text-sm text-zinc-600">加载中…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
