
import { NextResponse } from 'next/server';
import { getElevatorData, addDevice } from '@/services/elevator-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const elevators = getElevatorData();
  return NextResponse.json(elevators);
}

export async function POST(request: Request) {
    const { deviceId, deviceName, ipAddress, slaves } = await request.json();

    if (deviceId && deviceName && ipAddress && Array.isArray(slaves) && slaves.length > 0) {
        const result = addDevice(deviceId, ipAddress, slaves);
        
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 409 });
        }
        
        const elevators = getElevatorData();
        return NextResponse.json({ success: true, newDeviceId: deviceId, elevators });
    }

    return NextResponse.json({ error: 'Missing required fields for adding a device.' }, { status: 400 });
}
