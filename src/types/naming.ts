
export interface CustomNames {
  blocks: Record<string, string>; // Key is Block ID
  elevators: Record<string, string>; // Key is composite ID "blockId-elevatorNum"
  floors: Record<string, string>; // Key is floor number
}
