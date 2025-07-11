
import { NextResponse } from 'next/server';
import { getElevatorData, addBlock } from '@/services/elevator-service';
import { setBlockName } from '@/lib/naming-actions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const elevators = getElevatorData();
  return NextResponse.json(elevators);
}

export async function POST(request: Request) {
    const { blockName, numElevators } = await request.json();

    if (blockName && numElevators) {
        const newBlockId = addBlock(numElevators);
        // This would typically be a database operation.
        // For now, it logs the action.
        await setBlockName(newBlockId, blockName);
        const elevators = getElevatorData();
        return NextResponse.json({ success: true, newBlockId, elevators });
    }

    return NextResponse.json({ error: 'Missing blockName or numElevators' }, { status: 400 });
}
