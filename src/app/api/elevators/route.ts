
import { NextResponse } from 'next/server';
import { getElevatorData, addDevice } from '@/services/elevator-service';
import { setBlockName } from '@/lib/naming-actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const elevators = getElevatorData();
  return NextResponse.json(elevators);
}

export async function POST(request: Request) {
    const { deviceName, numSlaves } = await request.json();

    if (deviceName && numSlaves) {
        const newDeviceId = addDevice(numSlaves);
        // This would typically be a database operation.
        // For now, it logs the action and we use the client-side naming hook.
        await setBlockName(newDeviceId, deviceName); // Keeps using old naming action for logging
        const elevators = getElevatorData();
        return NextResponse.json({ success: true, newDeviceId, elevators });
    }

    return NextResponse.json({ error: 'Missing deviceName or numSlaves' }, { status: 400 });
}
