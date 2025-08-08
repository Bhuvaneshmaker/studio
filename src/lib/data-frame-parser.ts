
import type { ParsedElevatorData, FrameParseResult } from '@/types/parser';
import type { ElevatorDirection, DoorState } from '@/types/elevator';

function getBit(byte: number, bitPosition: number): number {
    return (byte >> bitPosition) & 1;
}

// This function mimics the CheckSum logic from your C++ code.
function calculateChecksum(bytes: number[]): number {
    // The checksum is a simple sum of all bytes, overflowing at 255 (uint8_t).
    const sum = bytes.reduce((acc, byte) => acc + byte, 0);
    return sum & 0xFF; // Return only the last 8 bits.
}

export function parseDataFrame(frameBytes: number[]): FrameParseResult {

    if (frameBytes.length < 6) { // Min frame: Header(1),Type(1),DevID(1),CRC(1),Footer(1) = 5 bytes. Let's say at least one slave data (+5) is not always there, but min length is still essential.
        return { success: false, error: 'Frame is too short.' };
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
    if (footer !== 0xff) {
        return { success: false, error: `Invalid footer. Expected 0xFF, got 0x${footer.toString(16)}.` };
    }

    // Per your C++ code, checksum is on all bytes *except* the last two (checksum and footer).
    const dataForChecksum = frameBytes.slice(0, frameBytes.length - 2);
    const calculatedChecksum = calculateChecksum(dataForChecksum);
    const receivedChecksum = frameBytes[frameBytes.length - 2];

    if (calculatedChecksum !== receivedChecksum) {
        // We can make this a soft warning instead of a hard error if needed.
        // For now, we will enforce it for data integrity.
        return { success: false, error: `Checksum mismatch. Calculated 0x${calculatedChecksum.toString(16)} but received 0x${receivedChecksum.toString(16)}.` };
    }


    const deviceId = frameBytes[2].toString();
    const elevatorsData: ParsedElevatorData[] = [];
    // The data for all slaves is between the device ID (byte 2) and the CRC/Footer (last 2 bytes)
    const slaveDataBytes = frameBytes.slice(3, frameBytes.length - 2);

    if (slaveDataBytes.length % 5 !== 0) {
        return { success: false, error: 'Slave data section has incorrect length. Each slave should have 5 bytes.' };
    }

    for (let i = 0; i < slaveDataBytes.length; i += 5) {
        const slaveChunk = slaveDataBytes.slice(i, i + 5);
        
        const slaveId = slaveChunk[0];
        const responseCode = slaveChunk[1];
        // dataByte1 is slaveChunk[2], but seems unused in favor of bits from dataByte2 and dataByte3
        const dataByte2 = slaveChunk[3]; // Contains status bits
        const dataByte3 = slaveChunk[4]; // Contains floor count

        // --- Parsing logic based on the spec ---
        
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
        return { success: false, error: 'No slave data could be parsed from the frame.' };
    }

    return {
        success: true,
        deviceId,
        data: elevatorsData,
    };
}
