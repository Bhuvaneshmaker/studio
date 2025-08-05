
'use server';

import { NextResponse } from 'next/server';
import { updateElevatorsFromParsedData } from '@/services/elevator-service';
import { parseDataFrame } from '@/lib/data-frame-parser';
import type { ParsedElevatorData } from '@/types/parser';

export async function POST(request: Request) {
    try {
        const frameBytes: number[] = await request.json();

        if (!Array.isArray(frameBytes) || frameBytes.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty data provided. Expected an array of bytes.' }, { status: 400 });
        }
        
        const allParsedData: ParsedElevatorData[] = [];
        
        // The frame now comes as a single byte array representing one UDP packet
        const result = parseDataFrame(frameBytes);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: result.error || 'Failed to parse frame.'}, { status: 400 });
        }
        
        allParsedData.push(...result.data);
        
        const updateResult = updateElevatorsFromParsedData(allParsedData);

        if (updateResult.success) {
            return NextResponse.json({ message: `${updateResult.updatedCount} elevators/slaves updated successfully.` });
        } else {
            return NextResponse.json({ error: 'Some elevators/slaves could not be found or updated.', details: updateResult.errors }, { status: 404 });
        }

    } catch (error) {
        console.error("Error processing parsed data:", error);
        return NextResponse.json({ error: 'An unexpected error occurred on the server.' }, { status: 500 });
    }
}
