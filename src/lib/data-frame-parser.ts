
import type { ParsedElevatorData, FrameParseResult } from '@/types/parser';
import type { ElevatorDirection, DoorState } from '@/types/elevator';

function hexToDec(hex: string): number {
    return parseInt(hex, 16);
}

function getBit(byte: number, bitPosition: number): number {
    return (byte >> bitPosition) & 1;
}

export function parseDataFrame(frame: string): FrameParseResult {
    const cleanedFrame = frame.replace(/\s+/g, '');

    if (cleanedFrame.length < 110) { // Minimal frame length (Header+Info+1Slave+CRC+Footer)
        return { success: false, error: 'Frame is too short.' };
    }
    if (!/^[0-9a-fA-F]+$/.test(cleanedFrame)) {
        return { success: false, error: 'Frame contains invalid hexadecimal characters.' };
    }

    const header = cleanedFrame.substring(0, 2);
    if (header !== '80') {
        return { success: false, error: `Invalid header. Expected '80', got '${header}'.` };
    }

    const frameType = cleanedFrame.substring(2, 4);
    if (frameType !== '05') {
        return { success: false, error: `Invalid frame type. Expected '05' for data frame, got '${frameType}'.` };
    }
    
    // Not using CRC and Footer for now, but good to know they are there.
    // const crc = cleanedFrame.substring(cleanedFrame.length - 4, cleanedFrame.length - 2);
    const footer = cleanedFrame.substring(cleanedFrame.length - 2);
    if (footer !== 'ff' && footer !== 'FF') {
        return { success: false, error: `Invalid footer. Expected 'FF', got '${footer}'.` };
    }

    const deviceId = hexToDec(cleanedFrame.substring(4, 6)).toString();
    const elevatorsData: ParsedElevatorData[] = [];
    const slaveDataContent = cleanedFrame.substring(6, cleanedFrame.length - 4);

    if (slaveDataContent.length % 10 !== 0) {
        return { success: false, error: 'Slave data section has incorrect length.' };
    }

    for (let i = 0; i < slaveDataContent.length; i += 10) {
        const slaveChunk = slaveDataContent.substring(i, i + 10);
        
        const slaveId = hexToDec(slaveChunk.substring(0, 2));
        const responseCode = hexToDec(slaveChunk.substring(2, 4));
        const dataByte1 = hexToDec(slaveChunk.substring(4, 6)); // Data
        const dataByte2 = hexToDec(slaveChunk.substring(6, 8)); // Data + Floor Direction (13 bit)
        const dataByte3 = hexToDec(slaveChunk.substring(8, 10)); // Floor Count

        // --- Parsing logic based on the spec ---
        
        // Byte 4: Response Status
        let responseStatus: 'Positive' | 'No Response' | 'Frame Error' = 'Positive';
        if (responseCode === 1) responseStatus = 'No Response';
        else if (responseCode === 2) responseStatus = 'Frame Error';
        
        // Byte 6: Data + Floor Direction
        const doorStateBit = getBit(dataByte2, 7); // Bit 7 for door
        const doorState: DoorState = doorStateBit === 1 ? 'OPEN' : 'CLOSED';

        const directionBit1 = getBit(dataByte2, 6); // Bit 6
        const directionBit0 = getBit(dataByte2, 5); // Bit 5
        let direction: ElevatorDirection = 'IDLE';
        if (directionBit1 === 0 && directionBit0 === 1) {
            direction = 'UP';
        } else if (directionBit1 === 1 && directionBit0 === 0) {
            direction = 'DOWN';
        }

        const mainPowerBit = getBit(dataByte2, 4);
        const mainPower = mainPowerBit === 1;

        const emergencyStopBit = getBit(dataByte2, 3);
        const emergencyStop = emergencyStopBit === 1;

        // Byte 7: Floor Count
        const currentFloor = dataByte3;
        
        elevatorsData.push({
            blockId: deviceId,
            elevatorNum: slaveId,
            responseStatus,
            currentFloor,
            direction,
            doorState,
            mainPower,
            emergencyStop
        });
    }

    if (elevatorsData.length === 0) {
        return { success: false, error: 'No slave data could be parsed from the frame.' };
    }

    return {
        success: true,
        deviceId,
        data: elevatorsData,
    };
}
