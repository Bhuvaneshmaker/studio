
import { NextResponse } from 'next/server';
import { addSingleElevator } from '@/services/elevator-service';
import { getElevatorData } from '@/services/elevator-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const { deviceId, slaveId, slaveAddress, slaveName } = await request.json();

    if (deviceId && slaveId && slaveAddress) {
        const result = addSingleElevator(deviceId, slaveId, slaveAddress, slaveName);
        
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 409 });
        }
        
        const elevators = getElevatorData();
        return NextResponse.json({ success: true, newElevatorId: result.newElevatorId, elevators });
    }

    return NextResponse.json({ error: 'Missing required fields for adding an elevator.' }, { status: 400 });
}
