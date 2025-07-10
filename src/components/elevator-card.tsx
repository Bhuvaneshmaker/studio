"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ElevatorData } from "@/types/elevator";
import { ArrowUp, ArrowDown, Minus, DoorOpen, DoorClosed, ShieldAlert, Wrench, CircleDot, Power, PowerOff, TriangleAlert } from "lucide-react";
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

const StatusBadge = ({ status, mainPower, emergencyStop }: { status: ElevatorData['status'], mainPower: boolean, emergencyStop: boolean }) => {
  if (!mainPower) {
    return <Badge variant="destructive" className="bg-gray-700 text-gray-200 border-gray-600"><PowerOff className="w-3 h-3 mr-1" />Offline</Badge>;
  }
  if (emergencyStop) {
    return <Badge variant="destructive"><TriangleAlert className="w-3 h-3 mr-1" />E-Stop</Badge>;
  }
  switch (status) {
    case 'MOVING':
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Moving</Badge>;
    case 'IDLE':
      return <Badge variant="secondary">Idle</Badge>;
    case 'MAINTENANCE':
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
    case 'ERROR':
      return <Badge variant="destructive">Fault</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export function ElevatorCard({ elevator }: { elevator: ElevatorData }) {
  const { id, currentFloor, direction, status, doorState, errorCode, totalFloors, destinationFloor, mainPower, emergencyStop } = elevator;
  const block = id.split('-')[0];

  const isOperational = mainPower && !emergencyStop;

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", !isOperational && "opacity-60 bg-muted/30")}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Elevator {id}</span>
          <StatusBadge status={status} mainPower={mainPower} emergencyStop={emergencyStop} />
        </CardTitle>
        <CardDescription>Block {block}</CardDescription>
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
                    destinationFloor === floor && status === 'MOVING' && isOperational && "ring-2 ring-blue-500"
                )}
                >
                {floor}
                {destinationFloor === floor && status === 'MOVING' && isOperational && <CircleDot className="absolute w-3 h-3 -right-1 -top-1 text-blue-500 bg-white rounded-full"/>}
                </div>
            ))}
            </div>
        </div>
        <div className="col-span-2 space-y-4">
            <div className="text-center bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Floor Count</p>
                <p className="text-6xl font-bold text-primary">{isOperational ? currentFloor : '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <DirectionIcon direction={isOperational ? direction : 'IDLE'} />
                    <div>
                        <p className="font-semibold">{isOperational ? direction : 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Direction</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <DoorIcon state={isOperational ? doorState : 'CLOSED'} />
                    <div>
                        <p className="font-semibold">{isOperational ? doorState : 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Door</p>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
       <CardFooter className="flex flex-col gap-2 pt-0 p-4">
        {(status === 'ERROR' && isOperational) && (
            <Alert variant="destructive" className="border-2 w-full text-xs p-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="font-bold">Fault Detected!</AlertTitle>
                <AlertDescription>
                Error code: {errorCode}.
                </AlertDescription>
            </Alert>
        )}
         <div className="grid grid-cols-2 gap-2 w-full text-xs">
            <div className={cn("flex items-center gap-2 p-2 rounded-md", mainPower ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                {mainPower ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                <span className="font-semibold">Main Power: {mainPower ? 'ON' : 'OFF'}</span>
            </div>
             <div className={cn("flex items-center gap-2 p-2 rounded-md", emergencyStop ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                <TriangleAlert className="w-4 h-4" />
                <span className="font-semibold">E-Stop: {emergencyStop ? 'ON' : 'OFF'}</span>
            </div>
         </div>
      </CardFooter>
    </Card>
  );
}
