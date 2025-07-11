
/**
 * @fileoverview Server-side service to manage elevator state.
 * This service maintains the state of all elevators in memory.
 * It's a singleton pattern in the context of a server module.
 */

import type { ElevatorData } from '@/types/elevator';
import { 
    generateInitialElevators,
    updateElevatorState as updateState,
    createBlock as createNewBlock
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

export function addBlock(numElevators: number): string {
    const existingBlockIds = [...new Set(elevators.map(e => parseInt(e.blockId, 10)))];
    const newBlockId = existingBlockIds.length > 0 ? Math.max(...existingBlockIds) + 1 : 1;
    const newBlockIdStr = newBlockId.toString();

    const newBlock = createNewBlock(newBlockIdStr, numElevators);
    elevators = [...elevators, ...newBlock];

    return newBlockIdStr;
}

// Automatically start the simulation when the server starts.
startSimulation();
