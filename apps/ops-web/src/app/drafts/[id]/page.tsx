import Link from 'next/link';

import { AppShell } from '@/components/AppShell';

type Props = { params: Promise<{ id: string }> };

export default async function DraftEditPage({ params }: Props) {
  const { id } = await params;

  return (
    <AppShell title={`编辑草稿：${id}（占位）`}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-zinc-700">标题</span>
            <input className="mt-1 w-full rounded-md border px-3 py-2" defaultValue={`Mock 标题 - ${id}`} />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-700">正文</span>
            <textarea
              className="mt-1 h-40 w-full rounded-md border px-3 py-2"
              defaultValue="这里是编辑器占位内容。后续可替换为富文本/Markdown 编辑器并对接内容域版本管理。"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800" type="button">
            保存草稿（占位）
          </button>
          <Link className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50" href="/review">
            提交审核（跳转占位）
          </Link>
          <Link className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50" href="/publish">
            发布（跳转占位）
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
