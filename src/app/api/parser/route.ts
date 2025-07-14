
'use server';

import { NextResponse } from 'next/server';
import { updateElevatorsFromParsedData } from '@/services/elevator-service';
import { parseDataFrame } from '@/lib/data-frame-parser';
import type { ParsedElevatorData } from '@/types/parser';

export async function POST(request: Request) {
    try {
        const frameStrings: string[] = await request.json();

        if (!Array.isArray(frameStrings) || frameStrings.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty data provided. Expected an array of hex strings.' }, { status: 400 });
        }
        
        const allParsedData: ParsedElevatorData[] = [];
        const parsingErrors: string[] = [];

        frameStrings.forEach(frame => {
            const result = parseDataFrame(frame);
            if (result.success && result.data) {
                allParsedData.push(...result.data);
            } else {
                parsingErrors.push(result.error || `Failed to parse frame: ${frame}`);
            }
        });

        if (allParsedData.length === 0) {
            return NextResponse.json({ error: 'No valid data could be parsed from the provided frames.', details: parsingErrors }, { status: 400 });
        }
        
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
