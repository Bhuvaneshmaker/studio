
"use client";

import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { AddElevatorForm } from "./add-elevator-form";
import type { ElevatorData } from "@/types/elevator";

export function AddElevatorFormWrapper({ 
    children, 
    onElevatorAdded,
    preselectedBlock,
    allDeviceIds
}: { 
    children: React.ReactNode, 
    onElevatorAdded: (newElevators: ElevatorData[]) => void,
    preselectedBlock?: string,
    allDeviceIds?: string[]
}) {
    const { user } = useAuth();
    const [isAddElevatorOpen, setIsAddElevatorOpen] = useState(false);

    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <AddElevatorForm
            open={isAddElevatorOpen}
            onOpenChange={setIsAddElevatorOpen}
            onElevatorAdded={onElevatorAdded}
            preselectedBlock={preselectedBlock}
            allDeviceIds={allDeviceIds}
        >
           <div onClick={() => setIsAddElevatorOpen(true)}>{children}</div>
        </AddElevatorForm>
    );
}
