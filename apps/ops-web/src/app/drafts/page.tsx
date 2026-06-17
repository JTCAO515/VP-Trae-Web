import Link from 'next/link';

import { AppShell } from '@/components/AppShell';

const MOCK_DRAFTS = [
  { id: 'draft_001', title: '北京 3 天游玩攻略（草稿）', updatedAt: '2026-06-17 10:20' },
  { id: 'draft_002', title: '上海 Citywalk 路线（草稿）', updatedAt: '2026-06-17 09:05' },
  { id: 'draft_003', title: '成都美食地图（草稿）', updatedAt: '2026-06-16 21:40' },
];

export default function DraftListPage() {
  return (
    <AppShell title="草稿列表（占位）">
      <div className="space-y-3">
        <p className="text-sm text-zinc-600">
          MVP：此页仅提供页面骨架与路由，后续可对接内容域（draft → review → publish）接口。
        </p>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">标题</th>
                <th className="px-3 py-2 text-left font-medium">更新时间</th>
                <th className="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DRAFTS.map((draft) => (
                <tr key={draft.id} className="border-t">
                  <td className="px-3 py-2">{draft.title}</td>
                  <td className="px-3 py-2 text-zinc-500">{draft.updatedAt}</td>
                  <td className="px-3 py-2 text-right">
                    <Link className="text-zinc-900 underline hover:text-zinc-700" href={`/drafts/${draft.id}`}>
                      编辑
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
