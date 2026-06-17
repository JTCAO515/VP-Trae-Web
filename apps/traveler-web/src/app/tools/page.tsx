import Link from 'next/link';

import { PageContainer } from '@/components/PageContainer';
import { fetchApiJson } from '@/lib/api';

type ToolGuideSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  locale: string;
};

export default async function ToolsPage() {
  const payload = await fetchApiJson<ToolGuideSummary[]>('/tools?locale=zh-CN');

  return (
    <PageContainer title="旅行工具">
      <div className="grid gap-4 md:grid-cols-2">
        {payload.data.map((item) => (
          <Link key={item.id} className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-zinc-300" href={`/tools/${item.id}`}>
            <h2 className="text-lg font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{item.summary}</p>
            <p className="mt-4 text-xs text-zinc-400">slug: {item.slug}</p>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
