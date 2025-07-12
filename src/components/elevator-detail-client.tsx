
"use client";

import React, { useState, useEffect } from 'react';
import type { ElevatorData } from '@/types/elevator';
import { useNaming } from "@/hooks/use-naming";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building, Power, PowerOff, TriangleAlert, ShieldAlert, Wrench, ArrowUp, ArrowDown, Minus, CircleDot, Landmark, SlidersHorizontal, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from "@/lib/utils";
import { BackButton } from '@/components/back-button';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const DetailItem = ({ icon, label, value, valueClassName }: { icon: React.ReactNode, label: string, value: string | React.ReactNode, valueClassName?: string }) => (
    <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={cn("font-bold text-base sm:text-lg text-right w-full sm:w-auto", valueClassName)}>{value}</span>
    </div>
);

const ActionConfirmationDialog = ({
    triggerButton,
    title,
    description,
    actionLabel,
    onConfirm,
    reasonLabel,
    reasonPlaceholder,
    isReasonRequired = true,
}: {
    triggerButton: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: (reason: string) => void;
    reasonLabel: string;
    reasonPlaceholder: string;
    isReasonRequired?: boolean;
}) => {
    const [reason, setReason] = useState('');
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        onConfirm(reason);
        setOpen(false);
        setReason('');
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {triggerButton}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor={`reason-${title.replace(/\s+/g, '-')}`}>{reasonLabel}</Label>
                    <Textarea 
                        id={`reason-${title.replace(/\s+/g, '-')}`} 
                        placeholder={reasonPlaceholder}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReason('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isReasonRequired && !reason.trim()}>
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const FaultControls = ({ elevator, onUpdate }: { elevator: ElevatorData, onUpdate: (elevator: ElevatorData) => void }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleFaultAction = async (action: 'triggerFault' | 'resolveFault', errorCode?: number, reason?: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/elevators/${elevator.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, errorCode, reason }),
            });
            if(response.ok) {
                const updatedElevator = await response.json();
                onUpdate(updatedElevator);
            }
        } catch (error) {
            console.error(`Failed to ${action}`, error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-orange-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertCircle /> Fault Controls
                </CardTitle>
                <CardDescription>Manually trigger or resolve a fault status for this elevator.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                {elevator.status !== 'ERROR' ? (
                     <ActionConfirmationDialog
                        title="Trigger Manual Fault"
                        description="Please provide a reason for manually triggering a fault. This will be logged."
                        actionLabel="Confirm and Trigger Fault"
                        onConfirm={(reason) => handleFaultAction('triggerFault', 999, reason)}
                        reasonLabel="Reason for Fault"
                        reasonPlaceholder="e.g., Investigating panel issue."
                        triggerButton={
                            <Button variant="secondary" className="w-full" disabled={isLoading}>
                                <AlertCircle className="mr-2" /> {isLoading ? 'Triggering...' : 'Trigger Manual Fault'}
                            </Button>
                        }
                    />
                ) : (
                    <Button onClick={() => handleFaultAction('resolveFault')} variant="secondary" className="w-full bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 border" disabled={isLoading}>
                        <ShieldCheck className="mr-2" /> {isLoading ? 'Resolving...' : 'Resolve Fault'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

const MaintenanceControls = ({ elevator, onUpdate }: { elevator: ElevatorData, onUpdate: (elevator: ElevatorData) => void }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleMaintenance = async (reason?: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/elevators/${elevator.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggleMaintenance', reason }),
            });
            if(response.ok) {
                const updatedElevator = await response.json();
                onUpdate(updatedElevator);
            }
        } catch (error) {
            console.error('Failed to toggle maintenance mode', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg border-yellow-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Wrench /> Maintenance Controls
                </CardTitle>
                <CardDescription>Manually enable or disable maintenance mode for this elevator.</CardDescription>
            </CardHeader>
            <CardContent>
                 {elevator.status === 'MAINTENANCE' ? (
                    <Button onClick={() => handleToggleMaintenance()} variant="secondary" className="w-full" disabled={isLoading}>
                        <Wrench className="mr-2" />
                        {isLoading ? 'Updating...' : 'Disable Maintenance Mode'}
                    </Button>
                ) : (
                    <ActionConfirmationDialog
                        title="Enable Maintenance Mode"
                        description="Please provide a reason for placing this elevator into maintenance mode."
                        actionLabel="Confirm and Enable"
                        onConfirm={(reason) => handleToggleMaintenance(reason)}
                        reasonLabel="Reason for Maintenance"
                        reasonPlaceholder="e.g., Scheduled quarterly inspection."
                        triggerButton={
                             <Button variant="secondary" className="w-full" disabled={isLoading}>
                                <Wrench className="mr-2" />
                                {isLoading ? 'Updating...' : 'Enable Maintenance Mode'}
                            </Button>
                        }
                    />
                )}
            </CardContent>
        </Card>
    );
};

export function ElevatorDetailClient({ initialElevator }: { initialElevator: ElevatorData }) {
    const [elevator, setElevator] = useState(initialElevator);
    const { getElevatorName, getDeviceName, getFloorName } = useNaming();

    // Set up polling to get "real-time" updates
    useEffect(() => {
        const fetchUpdates = async () => {
            const response = await fetch(`/api/elevators/${elevator.id}`, { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setElevator(data);
            }
        };

        const interval = setInterval(fetchUpdates, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [elevator.id]);

    const handleUpdate = (updatedElevator: ElevatorData) => {
        setElevator(updatedElevator);
    };
    
    const elevatorName = getElevatorName(elevator.id);
    const deviceName = getDeviceName(elevator.deviceId);
    
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
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 truncate">
                         <Link href="/" className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                                ElevateView
                            </h1>
                        </Link>
                         <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
                         <Link href={`/elevators?device=${elevator.deviceId}`} className="text-lg sm:text-2xl font-semibold text-foreground hover:underline truncate">
                            {deviceName}
                         </Link>
                         <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
                         <h2 className="text-lg sm:text-2xl font-semibold text-primary truncate">
                            {elevatorName}
                         </h2>
                    </div>
                    <BackButton />
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                   <div className="lg:col-span-1 space-y-8">
                        <Card className="shadow-lg h-full">
                            <CardHeader>
                                <CardTitle>Current Status</CardTitle>
                                <CardDescription>Real-time elevator overview</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="flex items-center justify-around text-center bg-muted/50 p-6 rounded-lg w-full gap-4">
                                    <div className="flex-1">
                                        <p className="text-lg text-muted-foreground">Floor</p>
                                        <p className="text-7xl font-bold text-primary">
                                            {isOperational ? getFloorName(currentFloor.toString()) : '-'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">of {totalFloors}</p>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                         <div className={cn("flex items-center justify-center gap-2 p-3 rounded-lg", statusInfo.color)}>
                                            {statusInfo.icon}
                                            <span className="font-bold text-lg">{statusInfo.text}</span>
                                        </div>
                                         <div className="flex items-center justify-center gap-2 p-3 rounded-lg">
                                            {getDirectionIcon()}
                                            <span className="font-bold text-lg">{isOperational ? direction : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
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
                                            {elevator.maintenanceDetails || "This unit is currently undergoing scheduled maintenance."}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                 {isOperational && status !== 'ERROR' && status !== 'MAINTENANCE' && (
                                    <Alert>
                                        <ShieldCheck className="h-4 w-4" />
                                        <AlertTitle>System Nominal</AlertTitle>
                                        <AlertDescription>
                                        All systems are operating correctly. No faults detected.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                        <MaintenanceControls elevator={elevator} onUpdate={handleUpdate} />
                        <FaultControls elevator={elevator} onUpdate={handleUpdate} />
                   </div>
                   <div className="lg:col-span-1">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>System Details</CardTitle>
                                <CardDescription>In-depth system and sensor information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <DetailItem 
                                    icon={<Landmark className="w-6 h-6 text-muted-foreground" />}
                                    label="Block ID"
                                    value={elevator.deviceId}
                                />
                                <DetailItem 
                                    icon={<SlidersHorizontal className="w-6 h-6 text-muted-foreground" />}
                                    label="Elevator No."
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
                                    icon={<CircleDot className={cn("w-6 h-6", status === 'MOVING' ? 'text-blue-500' : 'text-muted-foreground')} />}
                                    label="Destination"
                                    value={isOperational ? (destinationFloor === currentFloor ? "Holding" : getFloorName(destinationFloor.toString())) : "N/A"}
                                />
                                <DetailItem 
                                    icon={<CircleDot className="w-6 h-6 text-muted-foreground" />}
                                    label="Door State"
                                    value={elevator.doorState}
                                />
                            </CardContent>
                        </Card>
                   </div>
                </div>
            </main>
             <footer className="container mx-auto p-4 sm:p-6 border-t mt-8">
                <p className="text-center text-sm text-muted-foreground">
                    ElevateView &copy; {new Date().getFullYear()}. For support, contact <a href="mailto:support@bhuvitech.com" className="underline hover:text-primary">support@bhuvitech.com</a>.
                </p>
            </footer>
        </div>
    );
}
