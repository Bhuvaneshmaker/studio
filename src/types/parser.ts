
import type { ElevatorDirection, DoorState } from "./elevator";

export interface ParsedElevatorData {
    blockId: string;
    elevatorNum: number;
    responseStatus: 'Positive' | 'No Response' | 'Frame Error';
    currentFloor: number;
    direction: ElevatorDirection;
    doorState: DoorState;
    mainPower: boolean;
    emergencyStop: boolean;
}

export interface FrameParseResult {
    success: boolean;
    deviceId?: string;
    data?: ParsedElevatorData[];
    error?: string;
}
