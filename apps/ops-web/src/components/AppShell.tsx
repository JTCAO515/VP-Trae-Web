import Link from 'next/link';
import { cookies } from 'next/headers';

import { LogoutButton } from '@/components/LogoutButton';
import { AUTH_COOKIE_ROLE } from '@/lib/auth';

export async function AppShell(props: { title: string; children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get(AUTH_COOKIE_ROLE)?.value ?? 'unknown';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/drafts" className="font-semibold">
              VisePanda · 内容运营后台
            </Link>
            <nav className="flex items-center gap-3 text-sm text-zinc-600">
              <Link className="hover:text-zinc-900" href="/drafts">
                草稿
              </Link>
              <Link className="hover:text-zinc-900" href="/review">
                审核
              </Link>
              <Link className="hover:text-zinc-900" href="/publish">
                发布
              </Link>
              <Link className="hover:text-zinc-900" href="/assets">
                素材
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">role: {role}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{props.title}</h1>
        </div>
        <div className="rounded-lg border bg-white p-4">{props.children}</div>
      </main>
    </div>
  );
}
