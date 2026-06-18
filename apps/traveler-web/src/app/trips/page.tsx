import Link from 'next/link';

import { PageContainer } from '@/components/PageContainer';
import { fetchApiJson } from '@/lib/api';
import { requireTravelerSession } from '@/lib/guards';

type TripSummary = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  dayCount: number;
  isFavorite: boolean;
  updatedAt: string;
};

export default async function TripsPage() {
  const accessToken = await requireTravelerSession('/trips');
  const payload = await fetchApiJson<TripSummary[]>('/trips', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  return (
    <PageContainer title="我的行程">
      <div className="space-y-3">
        {payload.data.length ? null : (
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-600">还没有保存的行程，先去用 AI 规划一个吧。</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white" href="/ai/plan-trip">
                去 AI 规划
              </Link>
              <Link className="rounded-lg border px-4 py-2 text-sm text-zinc-700" href="/destinations">
                先看目的地
              </Link>
            </div>
          </div>
        )}
        {payload.data.map((trip) => (
          <a key={trip.id} className="block rounded-xl border bg-white p-5 shadow-sm transition hover:border-zinc-300" href={`/trips/${trip.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">{trip.title}</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  {trip.destination} · {trip.startDate} ~ {trip.endDate}
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">{trip.dayCount} 天</span>
            </div>
          </a>
        ))}
      </div>
    </PageContainer>
  );
}
