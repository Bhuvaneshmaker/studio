// This file is now primarily for generating sample data for development or testing.
// The main application logic should rely on the ini-service for initial state.

import type { ElevatorData } from '@/types/elevator';
import { MAX_FLOORS } from './constants';

const maintenanceReasons = [
  "Scheduled monthly inspection.",
  "Replacing worn-out door sensors.",
  "Upgrading control panel software.",
  "Repairing faulty wiring.",
  "Annual safety certification.",
  "Calibrating floor leveling system.",
  "Emergency brake system check.",
];

interface AlertInfo {
    id: string;
    title: string;
    description: string;
}

export const updateElevatorState = (
    prevElevators: ElevatorData[]
): { updatedElevators: ElevatorData[], newAlerts: AlertInfo[] } => {
    const newAlerts: AlertInfo[] = [];

    const updatedElevators = prevElevators.map(elevator => {
        let newElevator = { ...elevator };

        if (!newElevator.mainPower || newElevator.emergencyStop) {
            return newElevator;
        }

        if (newElevator.status === 'ERROR') {
            if (Math.random() < 0.1) {
            newElevator.status = 'IDLE';
            newElevator.errorCode = 0;
            }
            return newElevator;
        }

        if (newElevator.status === 'MAINTENANCE') {
             // Occasionally, a maintenance task finishes
            if (Math.random() < 0.01) {
                newElevator.status = 'IDLE';
                newElevator.maintenanceDetails = undefined;
            }
            return newElevator;
        }

        if (newElevator.doorState === 'OPENING') {
            newElevator.doorState = 'OPEN';
            return newElevator;
        }
        if (newElevator.doorState === 'OPEN') {
            newElevator.doorState = 'CLOSING';
            return newElevator;
        }
        if (newElevator.doorState === 'CLOSING') {
            newElevator.doorState = 'CLOSED';
        }
        
        if (newElevator.currentFloor !== newElevator.destinationFloor) {
            newElevator.status = 'MOVING';
            if (newElevator.currentFloor < newElevator.destinationFloor) {
            newElevator.direction = 'UP';
            newElevator.currentFloor++;
            } else {
            newElevator.direction = 'DOWN';
            newElevator.currentFloor--;
            }
        } else {
            if(newElevator.status === 'MOVING') {
                newElevator.status = 'IDLE';
                newElevator.direction = 'IDLE';
                newElevator.doorState = 'OPENING';
            }
        }

        if (newElevator.status === 'IDLE' && newElevator.doorState === 'CLOSED') {
            if(Math.random() < 0.05) {
                const newDestination = Math.floor(Math.random() * newElevator.totalFloors) + 1;
                if(newDestination !== newElevator.currentFloor) {
                    newElevator.destinationFloor = newDestination;
                }
            }
        }

        if (Math.random() < 0.001) {
            newElevator.status = 'ERROR';
            newElevator.errorCode = Math.floor(Math.random() * 5) + 101;
            newAlerts.push({
                id: newElevator.id,
                title: `Block ${newElevator.deviceId} - Elevator ${newElevator.elevatorNum} Alert!`,
                description: `A critical error (Code: ${newElevator.errorCode}) has been detected.`,
            });
        }
        
        return newElevator;
    });

    return { updatedElevators, newAlerts };
};
