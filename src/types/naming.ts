
export interface CustomNames {
  devices: Record<string, string>; // Key is IP Address
  slaves: Record<string, string>; // Key is composite ID "ip-slaveId"
  floors: Record<string, string>; // Key is floor number
}
