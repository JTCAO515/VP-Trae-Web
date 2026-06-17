import { AppShell } from '@/components/AppShell';

export default function ReviewPage() {
  return (
    <AppShell title="审核（占位）">
      <div className="space-y-3 text-sm">
        <p className="text-zinc-600">
          MVP：这里将展示待审核内容队列、审核意见与通过/驳回动作。当前仅保留占位。
        </p>
        <div className="rounded-md border bg-zinc-50 p-3">
          <div className="font-medium">待审核内容（Mock）</div>
          <ul className="mt-2 list-disc pl-5 text-zinc-700">
            <li>destination: 北京 3 天游玩攻略</li>
            <li>tool_guide: 机票退改签规则</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800" type="button">
            通过（占位）
          </button>
          <button className="rounded-md border px-3 py-2 hover:bg-zinc-50" type="button">
            驳回（占位）
          </button>
        </div>
      </div>
    </AppShell>
  );
}

