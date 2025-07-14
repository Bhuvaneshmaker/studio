
import fs from 'fs';
import path from 'path';
import ini from 'ini';
import type { ElevatorData } from '@/types/elevator';

const iniFilePath = path.join(process.cwd(), 'ini_ip.ini');

export function getElevatorDataFromIni(): ElevatorData[] {
  try {
    const iniFileContent = fs.readFileSync(iniFilePath, 'utf-8');
    const config = ini.parse(iniFileContent);
    const elevators: ElevatorData[] = [];

    for (const sectionKey in config) {
      const section = config[sectionKey];
      const deviceId = section.block_id;
      const ipAddress = section.ip_address;

      if (!deviceId) continue;

      Object.keys(section).forEach(key => {
        if (key.startsWith('elevator_') && !key.endsWith('_floor_count')) {
          const slaveId = section[key];
          const floorCountKey = `${key}_floor_count`;
          const totalFloors = parseInt(section[floorCountKey] || '15', 10);
          const compositeId = `${deviceId}-${slaveId}`;

          elevators.push({
            id: compositeId,
            deviceId,
            elevatorNum: parseInt(slaveId, 10),
            slaveAddress: slaveId,
            ipAddress,
            currentFloor: 1,
            direction: 'IDLE',
            status: 'IDLE',
            doorState: 'CLOSED',
            errorCode: 0,
            destinationFloor: 1,
            totalFloors: totalFloors,
            mainPower: false,
            emergencyStop: false,
          });
        }
      });
    }
    return elevators;
  } catch (error) {
    console.error("Could not read or parse ini_ip.ini. Returning empty array.", error);
    // If the file doesn't exist or is invalid, create it with default content
    if (!fs.existsSync(iniFilePath)) {
      const defaultConfig = `
; This file stores the configuration for your elevator hardware blocks.
; The udp-listener.js script reads from and writes to this file.
;
; [BLOCK_A] is a section header for a specific block. Use unique names.
; block_id: The unique identifier for the hardware device (controller).
; ip_address: The IP address of the hardware device.
; elevator_N: The slave ID for the Nth elevator connected to this block.
; elevator_N_floor_count: The number of floors this elevator serves.

[BLOCK_A]
block_id = A
ip_address = 192.168.0.30
elevator_1 = 1
elevator_1_floor_count = 15
elevator_2 = 2
elevator_2_floor_count = 15

[BLOCK_B]
block_id = B
ip_address = 192.168.0.31
elevator_1 = 1
elevator_1_floor_count = 15
`;
      fs.writeFileSync(iniFilePath, defaultConfig, 'utf-8');
      console.log('Created default ini_ip.ini file.');
    }
    return [];
  }
}
