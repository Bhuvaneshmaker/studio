
import { NextResponse } from 'next/server';
import { getHistoricalData } from '@/services/analytics-service';
import type { HistoricalPeriod } from '@/types/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') as HistoricalPeriod | null;
  
  if (!period || !['weekly', 'monthly', 'yearly'].includes(period)) {
    return NextResponse.json({ error: 'Invalid or missing period parameter. Use weekly, monthly, or yearly.' }, { status: 400 });
  }

  const data = await getHistoricalData(period);
  return NextResponse.json(data);
}
