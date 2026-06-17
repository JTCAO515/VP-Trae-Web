import { AppShell } from '@/components/AppShell';

export default function ModelsPage() {
  return (
    <AppShell title="模型权限（占位）">
      <div className="space-y-3 text-sm">
        <p className="text-zinc-600">
          MVP：此页作为模型配置/权限入口占位。后续可对接 AI 域（模型列表、路由策略、prompt 版本等）。
        </p>

        <div className="rounded-md border bg-zinc-50 p-3">
          <div className="font-medium">能力清单（占位）</div>
          <ul className="mt-2 list-disc pl-5 text-zinc-700">
            <li>模型启用/禁用</li>
            <li>按任务类型（chat/trip_planning）路由策略</li>
            <li>promptTemplateVersion 管理</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

