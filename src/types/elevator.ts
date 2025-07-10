export type SlaveDirection = 'UP' | 'DOWN' | 'IDLE';
export type SlaveStatus = 'MOVING' | 'IDLE' | 'MAINTENANCE' | 'ERROR';
export type DoorState = 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';

export interface SlaveData {
  // Composite ID for React keys, e.g., "192.168.1.10-1"
  id: string; 
  deviceIp: string;
  slaveId: number;
  currentFloor: number;
  direction: SlaveDirection;
  status: SlaveStatus;
  doorState: DoorState;
  errorCode: number;
  destinationFloor: number;
  totalFloors: number;
  mainPower: boolean;
  emergencyStop: boolean;
  maintenanceDetails?: string;
}
