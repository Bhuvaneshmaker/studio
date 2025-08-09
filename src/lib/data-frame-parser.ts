
import type { ParsedElevatorData, FrameParseResult } from '@/types/parser';
import type { ElevatorDirection, DoorState } from '@/types/elevator';

function getBit(byte: number, bitPosition: number): number {
    return (byte >> bitPosition) & 1;
}

function calculateChecksum(bytes: number[]): number {
    const sum = bytes.reduce((acc, byte) => acc + byte, 0);
    return sum & 0xFF;
}

export function parseDataFrame(frameBytes: number[]): FrameParseResult {

    if (frameBytes.length !== 55) {
        return { success: false, error: `Invalid frame length. Expected 55 bytes, got ${frameBytes.length}.` };
    }

    const header = frameBytes[0];
    if (header !== 0x80) {
        return { success: false, error: `Invalid header. Expected 0x80, got 0x${header.toString(16)}.` };
    }

    const frameType = frameBytes[1];
    if (frameType !== 0x05) {
        return { success: false, error: `Invalid frame type. Expected 0x05 for data frame, got 0x${frameType.toString(16)}.` };
    }

    const footer = frameBytes[frameBytes.length - 1];
    if (footer !== 0xFF) {
        return { success: false, error: `Invalid footer. Expected 0xFF, got 0x${footer.toString(16)}.` };
    }
    
    // Checksum is on bytes from index 0 to 52 (53 bytes total)
    const dataForChecksum = frameBytes.slice(0, 53);
    const calculatedChecksum = calculateChecksum(dataForChecksum);
    const receivedChecksum = frameBytes[53];

    if (calculatedChecksum !== receivedChecksum) {
        return { success: false, error: `Checksum mismatch. Calculated 0x${calculatedChecksum.toString(16)} but received 0x${receivedChecksum.toString(16)}.` };
    }

    const deviceId = frameBytes[2].toString();
    const elevatorsData: ParsedElevatorData[] = [];
    
    // The slave data is in 5-byte chunks starting from index 3 up to index 52.
    // This gives us 50 bytes for 10 slaves.
    for (let i = 0; i < 10; i++) {
        const offset = 3 + (i * 5);
        const slaveChunk = frameBytes.slice(offset, offset + 5);
        
        const slaveId = slaveChunk[0];
        
        // If slaveId is 0, it's an unconfigured/unused slot, so we skip it.
        if (slaveId === 0) {
            continue;
        }

        const responseCode = slaveChunk[1];
        const dataByte2 = slaveChunk[3]; // Contains status bits
        const dataByte3 = slaveChunk[4]; // Contains floor number

        let responseStatus: 'Positive' | 'No Response' | 'Frame Error' = 'Positive';
        if (responseCode === 1) responseStatus = 'No Response';
        else if (responseCode === 2) responseStatus = 'Frame Error';
        
        const doorStateBit = getBit(dataByte2, 7);
        const doorState: DoorState = doorStateBit === 1 ? 'OPEN' : 'CLOSED';

        const directionBit1 = getBit(dataByte2, 6);
        const directionBit0 = getBit(dataByte2, 5);
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

        const currentFloor = dataByte3;
        
        elevatorsData.push({
            deviceId: deviceId,
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
        return { success: true, deviceId, data: [], error: 'Frame contained no active elevator data.' };
    }

    return {
        success: true,
        deviceId,
        data: elevatorsData,
    };
}
