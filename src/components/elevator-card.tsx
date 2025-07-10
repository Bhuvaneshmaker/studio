
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ElevatorData } from "@/types/elevator";
import { ArrowUp, ArrowDown, Minus, ShieldAlert, Wrench, CircleDot, Power, PowerOff, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useNaming } from "@/hooks/use-naming";

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
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Wrench className="w-3 h-3 mr-1" />Maint.</Badge>;
    case 'ERROR':
      return <Badge variant="destructive">Fault</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export function ElevatorCard({ elevator }: { elevator: ElevatorData }) {
  const { id, currentFloor, direction, status, errorCode, destinationFloor, mainPower, emergencyStop } = elevator;
  const block = id.split('-')[0];
  const { getElevatorName, getBlockName } = useNaming();
  const elevatorName = getElevatorName(id);
  const blockName = getBlockName(block);

  const isOperational = mainPower && !emergencyStop;
  const hasFault = status === 'ERROR' || emergencyStop;

  return (
    <Link href={`/elevators/${id}`} className="block">
        <Card className={cn(
            "shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col h-full", 
            !isOperational && "opacity-60 bg-muted/30",
            hasFault && "border-red-500/80 shadow-red-500/20"
            )}>
        <CardHeader className="p-4">
            <CardTitle className="flex items-center justify-between text-base">
            <span className="truncate">{elevatorName}</span>
            <StatusBadge status={status} mainPower={mainPower} emergencyStop={emergencyStop} />
            </CardTitle>
            <CardDescription className="text-xs truncate">{blockName}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4 pt-0 flex items-center justify-around gap-4">
            <div className="flex flex-col justify-center text-center bg-muted/50 p-2 rounded-lg w-1/2 h-full">
                <p className="text-xs text-muted-foreground">Floor</p>
                <p className="text-5xl font-bold text-primary relative">
                    {isOperational ? currentFloor : '-'}
                    {destinationFloor !== currentFloor && status === 'MOVING' && isOperational && 
                        <span className="text-lg absolute bottom-0 -right-1 text-blue-500 animate-pulse">
                            <CircleDot className="w-3 h-3"/>
                        </span>
                    }
                </p>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-md w-1/2 h-full text-xs">
                <DirectionIcon direction={isOperational ? direction : 'IDLE'} />
                <div>
                    <p className="font-semibold">{isOperational ? direction : 'N/A'}</p>
                    <p className="text-muted-foreground">Direction</p>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 p-4 pt-0">
            {(status === 'ERROR' && isOperational) && (
                <Alert variant="destructive" className="border-2 w-full text-xs p-2">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="font-bold">Fault!</AlertTitle>
                    <AlertDescription>
                    Code: {errorCode}
                    </AlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
                <div className={cn("flex items-center gap-1.5 p-2 rounded-md justify-center", mainPower ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                    {mainPower ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                    <span className="font-semibold">{mainPower ? 'ON' : 'OFF'}</span>
                </div>
                <div className={cn("flex items-center gap-1.5 p-2 rounded-md justify-center", emergencyStop ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                    <TriangleAlert className="w-3 h-3" />
                    <span className="font-semibold">E-Stop: {emergencyStop ? 'ON' : 'OFF'}</span>
                </div>
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
}
