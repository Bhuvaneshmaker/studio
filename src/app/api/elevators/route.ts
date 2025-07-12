
import { NextResponse } from 'next/server';
import { getElevatorData, addDevice } from '@/services/elevator-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const elevators = getElevatorData();
  return NextResponse.json(elevators);
}

export async function POST(request: Request) {
    const { deviceName, numSlaves } = await request.json();

    if (deviceName && numSlaves) {
        const newDeviceId = addDevice(numSlaves);
        // Note: The custom name is set on the client-side via the useNaming hook,
        // which persists it to localStorage. A real DB would handle this server-side.
        const elevators = getElevatorData();
        return NextResponse.json({ success: true, newDeviceId, elevators });
    }

    return NextResponse.json({ error: 'Missing deviceName or numSlaves' }, { status: 400 });
}
