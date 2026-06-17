import Link from 'next/link';

import { PageContainer } from '@/components/PageContainer';

export default function HomePage() {
  return (
    <PageContainer title="中国旅行灵感与行程助手">
      <section className="rounded-2xl bg-zinc-900 px-6 py-10 text-white shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-300">VisePanda Traveler</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight">先浏览内容，再用 AI 生成行程；只有保存到我的行程时才需要登录。</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
          现在你可以直接查看目的地和工具内容、生成 AI 行程建议，并在满意后把结果保存成自己的 Trip 资产。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900" href="/ai/plan-trip">
            立即规划行程
          </Link>
          <Link className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white" href="/destinations">
            浏览目的地
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Link className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-zinc-300" href="/destinations">
          <h2 className="text-lg font-medium">浏览目的地</h2>
          <p className="mt-2 text-sm text-zinc-600">查看城市摘要、正文和亮点，再一键跳转到 AI 行程规划。</p>
        </Link>
        <Link className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-zinc-300" href="/tools">
          <h2 className="text-lg font-medium">实用工具</h2>
          <p className="mt-2 text-sm text-zinc-600">签证、材料、行前准备等工具内容已支持列表和详情阅读。</p>
        </Link>
        <Link className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-zinc-300" href="/trips">
          <h2 className="text-lg font-medium">我的行程</h2>
          <p className="mt-2 text-sm text-zinc-600">保存的 Trip 会聚合在这里，未登录时访问会自动引导到登录页。</p>
        </Link>
      </section>
    </PageContainer>
  );
}
