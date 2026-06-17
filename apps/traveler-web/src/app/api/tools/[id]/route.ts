import { proxyApi } from '@/lib/api';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale');
  const { id } = await ctx.params;
  const query = locale ? `?locale=${encodeURIComponent(locale)}` : '';

  return proxyApi(`/tools/${id}${query}`, { method: 'GET' });
}
