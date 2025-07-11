
import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/services/analytics-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getAnalyticsData();
  return NextResponse.json(data);
}
