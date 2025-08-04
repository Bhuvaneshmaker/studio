
/**
 * @fileoverview Server-side service to manage elevator state.
 * This service maintains the state of all elevators in memory.
 * It's a singleton pattern in the context of a server module.
 */

import type { ElevatorData } from '@/types/elevator';
import type { ParsedElevatorData } from '@/types/parser';
import type { Slave } from '@/types/elevator';
import { getElevatorDataFromIni } from './ini-service';
import { MAX_FLOORS } from '@/lib/constants';

// Initialize the state from the configuration file.
let elevators: ElevatorData[] = getElevatorDataFromIni(); 

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
    
    // If slaves are provided, create them. Otherwise, just create the block (for auto-discovery).
    const newElevators: ElevatorData[] = slaves.map(slave => {
        const compositeId = `${deviceId}-${slave.slaveId}`;
        return {
            id: compositeId,
            deviceId,
            elevatorNum: parseInt(slave.slaveId, 10),
            ipAddress,
            currentFloor: 1,
            direction: 'IDLE',
            status: 'IDLE',
            doorState: 'CLOSED',
            errorCode: 0,
            totalFloors: MAX_FLOORS,
            destinationFloor: 1,
            mainPower: false,
            emergencyStop: false,
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

interface UpdateResult {
    success: boolean;
    updatedCount: number;
    errors: { elevatorId: string; reason: string }[];
}

export function updateElevatorsFromParsedData(parsedData: ParsedElevatorData[]): UpdateResult {
    let updatedCount = 0;
    const errors: { elevatorId: string; reason: string }[] = [];

    parsedData.forEach(data => {
        const elevatorId = `${data.deviceId}-${data.elevatorNum}`;
        const elevatorIndex = elevators.findIndex(e => e.id === elevatorId);

        if (elevatorIndex !== -1) {
            const currentElevator = elevators[elevatorIndex];
            
            let newStatus: ElevatorData['status'] = currentElevator.status;
            
            // Critical overrides
            if (data.emergencyStop) {
                newStatus = 'ERROR';
            } else if (data.responseStatus !== 'Positive') {
                 newStatus = 'ERROR';
            } else if (currentElevator.status === 'MAINTENANCE') {
                // Maintenance mode is sticky until manually cleared.
                newStatus = 'MAINTENANCE';
            } else {
                 // Normal operation logic
                 if (data.direction !== 'IDLE') {
                    newStatus = 'MOVING';
                 } else {
                    newStatus = 'IDLE';
                 }
            }
            
            elevators[elevatorIndex] = {
                ...currentElevator,
                currentFloor: data.currentFloor,
                // Only update destination if the elevator is actually moving.
                destinationFloor: newStatus === 'MOVING' ? currentElevator.destinationFloor : data.currentFloor,
                direction: data.direction,
                doorState: data.doorState,
                mainPower: data.mainPower,
                emergencyStop: data.emergencyStop,
                status: newStatus,
                errorCode: data.responseStatus !== 'Positive' ? 404 : (data.emergencyStop ? 911 : 0),
            };
            updatedCount++;
        } else {
            errors.push({ elevatorId, reason: 'Elevator/Slave not found in system. Please add it.' });
        }
    });

    if (errors.length > 0) {
        console.warn('Errors during data update:', errors);
    }

    return {
        success: errors.length === 0,
        updatedCount,
        errors,
    };
}
