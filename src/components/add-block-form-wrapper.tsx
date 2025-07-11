
"use client";

import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { AddBlockForm } from "./add-block-form";
import type { ElevatorData } from "@/types/elevator";

export function AddBlockFormWrapper({ children, onBlockAdded }: { children: React.ReactNode, onBlockAdded: (newElevators: ElevatorData[]) => void }) {
    const { user } = useAuth();
    const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);

    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <AddBlockForm
            open={isAddBlockOpen}
            onOpenChange={setIsAddBlockOpen}
            onBlockAdded={onBlockAdded}
        >
           <div onClick={() => setIsAddBlockOpen(true)}>{children}</div>
        </AddBlockForm>
    );
}
