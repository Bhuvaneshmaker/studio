
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
} from '@/lib/elevator-simulation';
import type { Slave } from '@/types/elevator';

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

export function addDevice(deviceId: string, ipAddress: string, slaves: Slave[]): { success: boolean; error?: string } {
    const deviceExists = elevators.some(e => e.deviceId === deviceId);
    if (deviceExists) {
        return { success: false, error: `Device with ID ${deviceId} already exists.` };
    }
    
    const newElevators: ElevatorData[] = slaves.map(slave => {
        const compositeId = `${deviceId}-${slave.slaveId}`;
        
        return {
          id: compositeId,
          deviceId,
          elevatorNum: parseInt(slave.slaveId, 10),
          slaveAddress: slave.slaveAddress,
          currentFloor: 1,
          direction: 'IDLE',
          status: 'IDLE',
          doorState: 'CLOSED',
          errorCode: 0,
          totalFloors: 15, // Default value, can be configured later
          destinationFloor: 1,
          mainPower: true,
          emergencyStop: false,
          ipAddress,
        };
    });
    
    elevators = [...elevators, ...newElevators];
    return { success: true };
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

export function toggleMaintenanceStatus(id: string, reason?: string): boolean {
    const elevatorIndex = elevators.findIndex(e => e.id === id);
    if (elevatorIndex > -1) {
        const isCurrentlyMaintenance = elevators[elevatorIndex].status === 'MAINTENANCE';
        
        elevators[elevatorIndex] = {
            ...elevators[elevatorIndex],
            status: isCurrentlyMaintenance ? 'IDLE' : 'MAINTENANCE',
            direction: 'IDLE',
            maintenanceDetails: isCurrentlyMaintenance ? undefined : (reason || 'Manual maintenance activated.'),
            errorCode: 0,
        };
        return true;
    }
    return false;
}

export function toggleEmergencyStopStatus(id: string, reason?: string): boolean {
    // This feature is currently disabled.
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


// The simulation is no longer started automatically.
// To run the simulation for testing, you could create a temporary API endpoint to call startSimulation().
startSimulation();
