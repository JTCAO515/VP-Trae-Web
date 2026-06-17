import { AppShell } from '@/components/AppShell';

export default function AssetsPage() {
  return (
    <AppShell title="素材上传（占位）">
      <div className="space-y-3 text-sm">
        <p className="text-zinc-600">
          MVP：此页将对接对象存储（S3/MinIO）上传与素材管理。当前仅保留占位与交互示例。
        </p>

        <div className="rounded-md border bg-zinc-50 p-3">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">选择文件</span>
            <input className="mt-2 block w-full text-sm" type="file" />
          </label>
          <button className="mt-3 rounded-md bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800" type="button">
            上传（占位）
          </button>
        </div>

        <div className="rounded-md border p-3">
          <div className="font-medium">素材列表（占位）</div>
          <div className="mt-2 text-zinc-600">暂无数据</div>
        </div>
      </div>
    </AppShell>
  );
}

