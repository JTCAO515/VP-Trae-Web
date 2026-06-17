import Link from 'next/link';

import { AppShell } from '@/components/AppShell';

const MOCK_USERS = [
  { id: 'u_001', email: 'traveler@example.com', role: 'traveler', status: 'active' },
  { id: 'u_002', email: 'operator@visepanda.local', role: 'operator', status: 'active' },
  { id: 'u_003', email: 'admin@visepanda.local', role: 'admin', status: 'active' },
];

export default function UserListPage() {
  return (
    <AppShell title="用户列表（占位）">
      <div className="space-y-3">
        <p className="text-sm text-zinc-600">
          MVP：此页仅提供页面骨架与路由，后续可对接 AdminUsers 接口（查询/修改角色与状态）。
        </p>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">邮箱</th>
                <th className="px-3 py-2 text-left font-medium">角色</th>
                <th className="px-3 py-2 text-left font-medium">状态</th>
                <th className="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 text-zinc-500">{u.role}</td>
                  <td className="px-3 py-2 text-zinc-500">{u.status}</td>
                  <td className="px-3 py-2 text-right">
                    <Link className="text-zinc-900 underline hover:text-zinc-700" href={`/users/${u.id}`}>
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

