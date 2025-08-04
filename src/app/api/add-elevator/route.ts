
'use server';

import { NextResponse } from 'next/server';
import { addElevatorToBlock } from '@/services/elevator-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId, slaveId } = body;

        if (!deviceId || !slaveId) {
            return NextResponse.json({ error: 'Missing deviceId or slaveId.' }, { status: 400 });
        }
        
        const result = addElevatorToBlock(deviceId, slaveId);

        if (result.success) {
            return NextResponse.json({ success: true, elevators: result.elevators });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        console.error("Error in /api/add-elevator:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
