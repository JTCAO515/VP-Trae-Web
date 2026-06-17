import Link from 'next/link';

import { PageContainer } from '@/components/PageContainer';
import { fetchApiJson } from '@/lib/api';

type ToolGuideDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  versionNo: number;
  publishedAt: string | null;
};

export default async function ToolDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const payload = await fetchApiJson<ToolGuideDetail>(`/tools/${id}?locale=zh-CN`);
  const tool = payload.data;

  return (
    <PageContainer title={tool.title}>
      <div className="space-y-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">{tool.summary}</p>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{tool.body}</div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-medium">标签</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tool.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white" href="/ai/plan-trip">
            用 AI 继续规划
          </Link>
          <Link className="rounded-lg border px-4 py-2 text-sm text-zinc-700" href="/tools">
            返回工具列表
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
