
/**
 * @fileoverview Server-side service to manage elevator state.
 * This service maintains the state of all elevators in memory.
 * It's a singleton pattern in the context of a server module.
 */

import type { ElevatorData } from '@/types/elevator';
import type { ParsedElevatorData } from '@/types/parser';
import { 
    generateInitialElevators,
    updateElevatorState as updateState,
    createDevice as createNewDevice
} from '@/lib/elevator-simulation';

let elevators: ElevatorData[] = generateInitialElevators();
let simulationInterval: NodeJS.Timeout | null = null;

function updateElevators() {
    const { updatedElevators } = updateState(elevators);
    elevators = updatedElevators;
    // In a real app, you might emit events here to notify clients via websockets.
}

export function startSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    simulationInterval = setInterval(updateElevators, 2000);
    console.log("Elevator simulation started.");
}

export function stopSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log("Elevator simulation stopped.");
    }
}

export function getElevatorData(): ElevatorData[] {
    return elevators;
}

export function getElevatorById(id: string): ElevatorData | undefined {
    return elevators.find(e => e.id === id);
}

export function addDevice(numSlaves: number): string {
    const existingDeviceIds = [...new Set(elevators.map(e => parseInt(e.deviceId, 10)))].filter(id => !isNaN(id));
    const newDeviceId = existingDeviceIds.length > 0 ? Math.max(...existingDeviceIds) + 1 : 1;
    const newDeviceIdStr = newDeviceId.toString();

    const newDevice = createNewDevice(newDeviceIdStr, numSlaves);
    elevators = [...elevators, ...newDevice];

    return newDeviceIdStr;
}

export function setElevatorFault(id: string, errorCode: number): boolean {
    const elevatorIndex = elevators.findIndex(e => e.id === id);
    if (elevatorIndex > -1) {
        elevators[elevatorIndex] = {
            ...elevators[elevatorIndex],
            status: 'ERROR',
            errorCode: errorCode,
            direction: 'IDLE',
        };
        return true;
    }
    return false;
}

export function resolveElevatorFault(id: string): boolean {
    const elevatorIndex = elevators.findIndex(e => e.id === id);
    if (elevatorIndex > -1) {
        elevators[elevatorIndex] = {
            ...elevators[elevatorIndex],
            status: 'IDLE',
            errorCode: 0,
        };
        return true;
    }
    return false;
}

interface UpdateResult {
    success: boolean;
    updatedCount: number;
    errors: { elevatorId: string; reason: string }[];
}

export function updateElevatorsFromParsedData(parsedData: ParsedElevatorData[]): UpdateResult {
    stopSimulation(); // Stop simulation when manual data is pushed
    let updatedCount = 0;
    const errors: { elevatorId: string; reason: string }[] = [];

    parsedData.forEach(data => {
        const elevatorId = `${data.deviceId}-${data.elevatorNum}`;
        const elevatorIndex = elevators.findIndex(e => e.id === elevatorId);

        if (elevatorIndex !== -1) {
            const currentElevator = elevators[elevatorIndex];
            
            // Determine status
            let newStatus: ElevatorData['status'] = currentElevator.status;
            if (data.emergencyStop || data.responseStatus !== 'Positive') {
                newStatus = 'ERROR';
            } else if (currentElevator.status === 'ERROR' && !data.emergencyStop) {
                // If it was in error but the new data is clean, set to idle
                newStatus = 'IDLE';
            } else if (currentElevator.status !== 'MAINTENANCE') {
                 // Don't override maintenance status
                 if (data.direction !== 'IDLE') {
                    newStatus = 'MOVING';
                 } else {
                    newStatus = 'IDLE';
                 }
            }
            
            elevators[elevatorIndex] = {
                ...currentElevator,
                currentFloor: data.currentFloor,
                destinationFloor: data.direction !== 'IDLE' ? currentElevator.destinationFloor : data.currentFloor,
                direction: data.direction,
                doorState: data.doorState,
                mainPower: data.mainPower,
                emergencyStop: data.emergencyStop,
                status: newStatus,
                errorCode: data.responseStatus !== 'Positive' ? 404 : (data.emergencyStop ? 911 : 0),
            };
            updatedCount++;
        } else {
            errors.push({ elevatorId, reason: 'Elevator/Slave not found in system.' });
        }
    });

    return {
        success: errors.length === 0,
        updatedCount,
        errors,
    };
}


// Automatically start the simulation when the server starts.
startSimulation();
