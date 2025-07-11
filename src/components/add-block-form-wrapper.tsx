
"use client";

import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { AddBlockForm } from "./add-block-form";
import { createBlockAction } from "@/services/elevator-actions";

export function AddBlockFormWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);

    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <AddBlockForm
            open={isAddBlockOpen}
            onOpenChange={setIsAddBlockOpen}
            formAction={createBlockAction}
        >
           <div onClick={() => setIsAddBlockOpen(true)}>{children}</div>
        </AddBlockForm>
    );
}
