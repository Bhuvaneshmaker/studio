
"use client";

import type { ElevatorData } from '@/types/elevator';
import { getElevatorById } from '@/services/elevator-actions';
import { useNaming } from "@/hooks/use-naming";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Building, Power, PowerOff, TriangleAlert, ShieldAlert, Wrench, ArrowUp, ArrowDown, Minus, CircleDot, Landmark, SlidersHorizontal } from 'lucide-react';
import { cn } from "@/lib/utils";
import { BackButton } from '@/components/back-button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DetailItem = ({ icon, label, value, valueClassName }: { icon: React.ReactNode, label: string, value: string | React.ReactNode, valueClassName?: string }) => (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={cn("font-bold text-lg", valueClassName)}>{value}</span>
    </div>
);

export default function ElevatorDetailPage({ params: { id } }: { params: { id: string } }) {
    const [elevator, setElevator] = useState<ElevatorData | null>(null);
    const { getElevatorName, getFloorName } = useNaming();

    useEffect(() => {
        const fetchElevator = async () => {
            const data = await getElevatorById(id);
            if (data) {
                setElevator(data);
            }
        };
        fetchElevator();
    }, [id]);

    if (!elevator) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-2xl font-semibold">Loading Elevator Data...</p>
                    <p className="text-muted-foreground">Or the requested elevator does not exist.</p>
                </div>
            </div>
        );
    }

    const elevatorName = getElevatorName(elevator.id);
    
    const { currentFloor, direction, status, errorCode, totalFloors, destinationFloor, mainPower, emergencyStop } = elevator;
    const isOperational = mainPower && !emergencyStop;

    const getStatusInfo = () => {
        if (!mainPower) return { text: "Offline", icon: <PowerOff className="w-6 h-6 text-gray-500" />, color: "text-gray-500" };
        if (emergencyStop) return { text: "Emergency Stop", icon: <TriangleAlert className="w-6 h-6 text-red-500" />, color: "text-red-500" };
        switch(status) {
            case 'MOVING': return { text: "Moving", icon: <CircleDot className="w-6 h-6 text-blue-500 animate-pulse" />, color: "text-blue-500" };
            case 'IDLE': return { text: "Idle", icon: <Minus className="w-6 h-6 text-green-500" />, color: "text-green-500" };
            case 'MAINTENANCE': return { text: "Maintenance", icon: <Wrench className="w-6 h-6 text-yellow-500" />, color: "text-yellow-500" };
            case 'ERROR': return { text: "Fault Detected", icon: <ShieldAlert className="w-6 h-6 text-red-500" />, color: "text-red-500" };
            default: return { text: "Unknown", icon: <Minus className="w-6 h-6 text-muted-foreground" />, color: "text-muted-foreground" };
        }
    };
    const statusInfo = getStatusInfo();

    const getDirectionIcon = () => {
        if (!isOperational) return <Minus className="w-6 h-6 text-muted-foreground" />;
        switch(direction) {
            case 'UP': return <ArrowUp className="w-6 h-6 text-green-500" />;
            case 'DOWN': return <ArrowDown className="w-6 h-6 text-orange-500" />;
            default: return <Minus className="w-6 h-6 text-muted-foreground" />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
             <header className="p-4 sm:p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 truncate">
                         <Link href="/" className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                                <Building className="w-6 h-6" />
                            </div>
                            <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                                ElevateView
                            </h1>
                        </Link>
                         <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
                         <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">
                            {elevatorName} (Block {elevator.blockId})
                         </h2>
                    </div>
                    <BackButton />
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-1">
                        <Card className="shadow-lg h-full">
                            <CardHeader>
                                <CardTitle>Current Status</CardTitle>
                                <CardDescription>Real-time elevator overview</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                               <div className="flex items-center justify-center text-center bg-muted/50 p-6 rounded-lg w-full">
                                    <div>
                                        <p className="text-lg text-muted-foreground">Floor</p>
                                        <p className="text-8xl sm:text-9xl font-bold text-primary relative">
                                            {isOperational ? getFloorName(currentFloor.toString()) : '-'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">of {totalFloors}</p>
                                    </div>
                                </div>
                                <div className={cn("flex items-center gap-3 p-4 rounded-lg w-full justify-center", statusInfo.color)}>
                                    {statusInfo.icon}
                                    <span className="text-2xl font-bold">{statusInfo.text}</span>
                                </div>
                            </CardContent>
                        </Card>
                   </div>
                   <div className="lg:col-span-2">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>System Details</CardTitle>
                                <CardDescription>In-depth system and sensor information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <DetailItem 
                                    icon={<Landmark className="w-6 h-6 text-muted-foreground" />}
                                    label="Block ID"
                                    value={elevator.blockId}
                                />
                                <DetailItem 
                                    icon={<SlidersHorizontal className="w-6 h-6 text-muted-foreground" />}
                                    label="Elevator ID"
                                    value={elevator.elevatorNum.toString()}
                                />
                                <Separator/>
                                <DetailItem 
                                    icon={mainPower ? <Power className="w-6 h-6 text-green-500" /> : <PowerOff className="w-6 h-6 text-red-500" />}
                                    label="Main Power"
                                    value={mainPower ? 'ON' : 'OFF'}
                                    valueClassName={mainPower ? 'text-green-500' : 'text-red-500'}
                                />
                                <DetailItem 
                                    icon={<TriangleAlert className={cn("w-6 h-6", emergencyStop ? 'text-red-500' : 'text-green-500')} />}
                                    label="Emergency Stop"
                                    value={emergencyStop ? 'ACTIVE' : 'INACTIVE'}
                                    valueClassName={emergencyStop ? 'text-red-500' : 'text-green-500'}
                                />
                                <Separator/>
                                 <DetailItem 
                                    icon={getDirectionIcon()}
                                    label="Direction"
                                    value={isOperational ? direction : "N/A"}
                                />
                                <DetailItem 
                                    icon={<CircleDot className={cn("w-6 h-6", status === 'MOVING' ? 'text-blue-500' : 'text-muted-foreground')} />}
                                    label="Destination"
                                    value={isOperational ? (destinationFloor === currentFloor ? "Holding" : getFloorName(destinationFloor.toString())) : "N/A"}
                                />
                                 <Separator/>
                                 {status === 'ERROR' && isOperational && (
                                    <Alert variant="destructive" className="border-2">
                                        <ShieldAlert className="h-4 w-4" />
                                        <AlertTitle className="font-bold">Fault Detected!</AlertTitle>
                                        <AlertDescription>
                                        An issue has been automatically detected. Error code: <strong>{errorCode}</strong>. Maintenance may be required.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {status === 'MAINTENANCE' && (
                                    <Alert className="border-yellow-500/50 text-yellow-600 dark:text-yellow-500">
                                        <Wrench className="h-4 w-4 !text-yellow-500" />
                                        <AlertTitle className="font-bold">Under Maintenance</AlertTitle>
                                        <AlertDescription>
                                            This elevator is currently undergoing scheduled maintenance.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                 {isOperational && status !== 'ERROR' && status !== 'MAINTENANCE' && (
                                    <Alert>
                                        <ShieldAlert className="h-4 w-4" />
                                        <AlertTitle>System Nominal</AlertTitle>
                                        <AlertDescription>
                                        All systems are operating correctly. No faults detected.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                   </div>
                </div>
            </main>
             <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
                <p className="text-center text-sm text-muted-foreground">
                    ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline">support@bhuvitech.com</a>.
                </p>
            </footer>
        </div>
    )
}
