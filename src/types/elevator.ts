
export type ElevatorDirection = 'UP' | 'DOWN' | 'IDLE';
export type ElevatorStatus = 'MOVING' | 'IDLE' | 'MAINTENANCE' | 'ERROR';
export type DoorState = 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';

export interface ElevatorData {
  // Composite ID for React keys, e.g., "A-1" for Device A, Elevator/Slave 1
  id: string; 
  deviceId: string;
  elevatorNum: number; // This is the Slave ID
  slaveAddress?: string; // Slave address
  ipAddress?: string; // IP address of the parent device
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

export interface Block {
    deviceId: string;
    deviceName: string;
    ipAddress: string;
}

export interface Slave {
  slaveId: string;
  slaveAddress: string;
  slaveName?: string;
}
