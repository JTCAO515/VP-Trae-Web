import Link from 'next/link';

import { AppShell } from '@/components/AppShell';
import { UserEditor } from './UserEditor';

type Props = { params: Promise<{ id: string }> };

export default async function UserDetailPage({ params }: Props) {
  const { id: userId } = await params;

  return (
    <AppShell title={`用户详情：${userId}（占位）`}>
      <div className="space-y-4">
        <div className="rounded-md border bg-zinc-50 p-3 text-sm">
          <div className="font-medium">基础信息（Mock）</div>
          <div className="mt-2 grid gap-1 text-zinc-700">
            <div>
              <span className="text-zinc-500">userId：</span>
              {userId}
            </div>
            <div>
              <span className="text-zinc-500">email：</span>
              {userId === 'u_003' ? 'admin@visepanda.local' : 'traveler@example.com'}
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-3 text-sm font-medium">角色与状态修改（占位）</div>
          <UserEditor userId={userId} initialRole="traveler" initialStatus="active" />
        </div>

        <div className="rounded-md border p-3">
          <div className="text-sm font-medium">模型权限入口（占位）</div>
          <p className="mt-1 text-sm text-zinc-600">
            后续可在此配置某用户/角色的模型可用性、优先级、路由策略等。
          </p>
          <div className="mt-2">
            <Link className="text-sm underline hover:text-zinc-700" href="/models">
              前往模型权限页
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
