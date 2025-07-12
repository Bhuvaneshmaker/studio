
"use client";

import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { AddDeviceForm } from "./add-device-form";
import type { ElevatorData } from "@/types/elevator";

export function AddDeviceFormWrapper({ children, onDeviceAdded }: { children: React.ReactNode, onDeviceAdded: (newElevators: ElevatorData[]) => void }) {
    const { user } = useAuth();
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);

    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <AddDeviceForm
            open={isAddDeviceOpen}
            onOpenChange={setIsAddDeviceOpen}
            onDeviceAdded={onDeviceAdded}
        >
           <div onClick={() => setIsAddDeviceOpen(true)}>{children}</div>
        </AddDeviceForm>
    );
}
