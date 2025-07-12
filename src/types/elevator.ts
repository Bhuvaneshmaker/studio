
export type ElevatorDirection = 'UP' | 'DOWN' | 'IDLE';
export type ElevatorStatus = 'MOVING' | 'IDLE' | 'MAINTENANCE' | 'ERROR';
export type DoorState = 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';

export interface ElevatorData {
  // Composite ID for React keys, e.g., "1-1" for Device 1, Elevator/Slave 1
  id: string; 
  deviceId: string;
  elevatorNum: number; // This is the Slave ID
  currentFloor: number;
  direction: ElevatorDirection;
  status: ElevatorStatus;
  doorState: DoorState;
  errorCode: number;
  destinationFloor: number;
  totalFloors: number;
  mainPower: boolean;
  emergencyStop: boolean;
  maintenanceDetails?: string;
}
