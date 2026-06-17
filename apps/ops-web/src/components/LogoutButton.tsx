'use client';

import { useRouter } from 'next/navigation';

import { AUTH_COOKIE_ACCESS_TOKEN, AUTH_COOKIE_ROLE } from '@/lib/auth';

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-md border px-3 py-1 text-sm hover:bg-zinc-50"
      onClick={() => {
        clearCookie(AUTH_COOKIE_ACCESS_TOKEN);
        clearCookie(AUTH_COOKIE_ROLE);
        localStorage.removeItem(AUTH_COOKIE_ACCESS_TOKEN);
        localStorage.removeItem(AUTH_COOKIE_ROLE);
        router.replace('/login');
      }}
      type="button"
    >
      退出登录
    </button>
  );
}

