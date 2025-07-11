
import { NextResponse } from 'next/server';
import { getElevatorById, setElevatorFault, resolveElevatorFault } from '@/services/elevator-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const elevator = getElevatorById(params.id);
  if (elevator) {
    return NextResponse.json(elevator);
  }
  return NextResponse.json({ error: 'Elevator not found' }, { status: 404 });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const { action, errorCode } = await request.json();
    const { id } = params;

    if (action === 'triggerFault') {
        if (setElevatorFault(id, errorCode || 999)) {
            const elevator = getElevatorById(id);
            return NextResponse.json(elevator);
        }
        return NextResponse.json({ error: 'Could not trigger fault' }, { status: 500 });
    }

    if (action === 'resolveFault') {
        if (resolveElevatorFault(id)) {
            const elevator = getElevatorById(id);
            return NextResponse.json(elevator);
        }
        return NextResponse.json({ error: 'Could not resolve fault' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
