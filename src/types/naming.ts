
export interface CustomNames {
  devices: Record<string, string>; // Key is Device ID
  elevators: Record<string, string>; // Key is composite ID "deviceId-elevatorNum"
  floors: Record<string, string>; // Key is floor number
}
