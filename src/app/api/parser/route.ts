
'use server';

import { NextResponse } from 'next/server';
import { updateElevatorsFromParsedData } from '@/services/elevator-service';
import type { ParsedElevatorData } from '@/types/parser';

export async function POST(request: Request) {
    try {
        const parsedData: ParsedElevatorData[] = await request.json();

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty data provided.' }, { status: 400 });
        }
        
        const result = updateElevatorsFromParsedData(parsedData);

        if (result.success) {
            return NextResponse.json({ message: `${result.updatedCount} elevators/slaves updated successfully.` });
        } else {
            return NextResponse.json({ error: 'Some elevators/slaves could not be found or updated.', details: result.errors }, { status: 404 });
        }

    } catch (error) {
        console.error("Error processing parsed data:", error);
        return NextResponse.json({ error: 'An unexpected error occurred on the server.' }, { status: 500 });
    }
}
