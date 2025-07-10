"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ElevatorData } from "@/types/elevator";
import { ArrowUp, ArrowDown, Minus, DoorOpen, DoorClosed, ShieldAlert, Wrench, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const DirectionIcon = ({ direction }: { direction: ElevatorData['direction'] }) => {
  switch (direction) {
    case 'UP':
      return <ArrowUp className="w-5 h-5 text-green-500" />;
    case 'DOWN':
      return <ArrowDown className="w-5 h-5 text-orange-500" />;
    default:
      return <Minus className="w-5 h-5 text-muted-foreground" />;
  }
};

const DoorIcon = ({ state }: { state: ElevatorData['doorState'] }) => {
  switch (state) {
    case 'OPEN':
    case 'OPENING':
      return <DoorOpen className="w-5 h-5 text-blue-500" />;
    default:
      return <DoorClosed className="w-5 h-5 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: ElevatorData['status'] }) => {
  switch (status) {
    case 'MOVING':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Moving</Badge>;
    case 'IDLE':
      return <Badge variant="secondary">Idle</Badge>;
    case 'MAINTENANCE':
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
    case 'ERROR':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export function ElevatorCard({ elevator }: { elevator: ElevatorData }) {
  const { id, currentFloor, direction, status, doorState, errorCode, totalFloors, destinationFloor } = elevator;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Elevator {id}</span>
          <StatusBadge status={status} />
        </CardTitle>
        <CardDescription>Building 1, Section {id.split('-')[0]}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col items-center justify-center bg-muted/50 rounded-lg p-2 space-y-2">
            <p className="text-xs text-muted-foreground">Floors</p>
            <div className="flex flex-col-reverse items-center gap-1">
            {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map((floor) => (
                <div
                key={floor}
                className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all duration-300 relative",
                    currentFloor === floor ? "bg-primary text-primary-foreground" : "bg-background",
                    destinationFloor === floor && status === 'MOVING' && "ring-2 ring-blue-500"
                )}
                >
                {floor}
                {destinationFloor === floor && status === 'MOVING' && <CircleDot className="absolute w-3 h-3 -right-1 -top-1 text-blue-500 bg-white rounded-full"/>}
                </div>
            ))}
            </div>
        </div>
        <div className="col-span-2 space-y-4">
            <div className="text-center bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Floor</p>
                <p className="text-6xl font-bold text-primary">{currentFloor}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <DirectionIcon direction={direction} />
                    <div>
                        <p className="font-semibold">{direction}</p>
                        <p className="text-xs text-muted-foreground">Direction</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <DoorIcon state={doorState} />
                    <div>
                        <p className="font-semibold">{doorState}</p>
                        <p className="text-xs text-muted-foreground">Door</p>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
      {status === 'ERROR' && (
        <div className="p-6 pt-0">
          <Alert variant="destructive" className="border-2">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Emergency Alert!</AlertTitle>
            <AlertDescription>
              Error code: {errorCode}. The elevator has reported a critical issue.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
