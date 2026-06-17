import { AppShell } from '@/components/AppShell';

const MOCK_PUBLISHED = [
  { id: 'pub_001', title: '北京 3 天游玩攻略', publishedAt: '2026-06-16 18:30' },
  { id: 'pub_002', title: '上海 Citywalk 路线', publishedAt: '2026-06-15 11:10' },
];

export default function PublishPage() {
  return (
    <AppShell title="发布记录（占位）">
      <div className="space-y-3">
        <p className="text-sm text-zinc-600">
          MVP：此页将用于查看发布历史、版本回滚入口与内容状态。当前仅展示 mock 数据。
        </p>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">标题</th>
                <th className="px-3 py-2 text-left font-medium">发布时间</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PUBLISHED.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2 text-zinc-500">{item.publishedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

