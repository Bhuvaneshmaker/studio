
"use client";

import { useState } from 'react';
import { useNaming } from '@/hooks/use-naming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Building, Save, X } from 'lucide-react';
import Link from 'next/link';
import { NUM_BLOCKS, NUM_ELEVATORS_PER_BLOCK } from '@/lib/elevator-simulation';

const allBlockIds = Array.from({ length: NUM_BLOCKS }, (_, i) => (i + 1).toString());
const allElevatorIds = Array.from({ length: NUM_BLOCKS }, (_, i) => {
    const blockId = i + 1;
    return Array.from({ length: NUM_ELEVATORS_PER_BLOCK }, (_, j) => `${blockId}-${j + 1}`);
}).flat();

const NamingForm = ({ id, currentName, onSave, onCancel }: { id: string, currentName: string, onSave: (name: string) => void, onCancel: () => void }) => {
    const [name, setName] = useState(currentName);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    }

    return (
        <form onSubmit={handleSave} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mt-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter new name" className="bg-background"/>
            <Button type="submit" size="icon" variant="ghost" className="text-green-500 hover:text-green-600"><Save className="w-5 h-5"/></Button>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} className="text-red-500 hover:text-red-600"><X className="w-5 h-5"/></Button>
        </form>
    );
};

export default function NamingPage() {
    const { customNames, getBlockName, getElevatorName, setBlockName, setElevatorName, deleteBlockName, deleteElevatorName } = useNaming();
    const [editingBlock, setEditingBlock] = useState<string | null>(null);
    const [editingElevator, setEditingElevator] = useState<string | null>(null);

    return (
        <div className="min-h-screen">
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
                            Manage Naming
                        </h2>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Block Names</CardTitle>
                            <CardDescription>Assign custom names to building blocks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {allBlockIds.map(id => (
                                <div key={id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="font-medium">{getBlockName(id)}</div>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setEditingBlock(id)}>
                                                <Pencil className="w-4 h-4"/>
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteBlockName(id)} disabled={!customNames.blocks[id]}>
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                    {editingBlock === id && (
                                        <NamingForm
                                            id={id}
                                            currentName={customNames.blocks[id] || ''}
                                            onSave={(name) => {
                                                setBlockName(id, name);
                                                setEditingBlock(null);
                                            }}
                                            onCancel={() => setEditingBlock(null)}
                                        />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Elevator Names</CardTitle>
                            <CardDescription>Assign custom names to individual elevators.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                           {allElevatorIds.map(id => (
                                <div key={id} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="font-medium truncate">{getElevatorName(id)}</div>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setEditingElevator(id)}>
                                                <Pencil className="w-4 h-4"/>
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteElevatorName(id)} disabled={!customNames.elevators[id]}>
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                     {editingElevator === id && (
                                        <NamingForm
                                            id={id}
                                            currentName={customNames.elevators[id] || ''}
                                            onSave={(name) => {
                                                setElevatorName(id, name);
                                                setEditingElevator(null);
                                            }}
                                            onCancel={() => setEditingElevator(null)}
                                        />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
