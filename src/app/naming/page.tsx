
"use client";

import { useState } from 'react';
import { useNaming } from '@/hooks/use-naming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Building, Save, X, Home } from 'lucide-react';
import Link from 'next/link';
import { NUM_BLOCKS, NUM_ELEVATORS_PER_BLOCK, MAX_FLOORS } from '@/lib/elevator-simulation';

const allBlockIds = Array.from({ length: NUM_BLOCKS }, (_, i) => (i + 1).toString());
const allElevatorIds = Array.from({ length: NUM_BLOCKS }, (_, i) => {
    const blockId = i + 1;
    return Array.from({ length: NUM_ELEVATORS_PER_BLOCK }, (_, j) => `${blockId}-${j + 1}`);
}).flat();
const allFloorIds = Array.from({ length: MAX_FLOORS }, (_, i) => (i + 1).toString());


const NamingForm = ({ id, currentName, onSave, onCancel, placeholder }: { id: string, currentName: string, onSave: (name: string) => void, onCancel: () => void, placeholder: string }) => {
    const [name, setName] = useState(currentName);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    }

    return (
        <form onSubmit={handleSave} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mt-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className="bg-background"/>
            <Button type="submit" size="icon" variant="ghost" className="text-green-500 hover:text-green-600"><Save className="w-5 h-5"/></Button>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} className="text-red-500 hover:text-red-600"><X className="w-5 h-5"/></Button>
        </form>
    );
};

export default function NamingPage() {
    const { 
        customNames, 
        getBlockName, getElevatorName, getFloorName,
        setBlockName, setElevatorName, setFloorName,
        deleteBlockName, deleteElevatorName, deleteFloorName
    } = useNaming();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingType, setEditingType] = useState<'block' | 'elevator' | 'floor' | null>(null);
    
    const handleEditClick = (id: string, type: 'block' | 'elevator' | 'floor') => {
        setEditingId(id);
        setEditingType(type);
    }
    
    const handleCancel = () => {
        setEditingId(null);
        setEditingType(null);
    }

    const renderNamingList = (
        itemIds: string[], 
        type: 'block' | 'elevator' | 'floor',
        getName: (id: string) => string,
        setName: (id: string, name: string) => void,
        deleteName: (id: string) => void,
        customNameMap: Record<string, string>,
        placeholderPrefix: string
    ) => (
        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {itemIds.map(id => (
                <div key={id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="font-medium">{getName(id)}</div>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditClick(id, type)}>
                                <Pencil className="w-4 h-4"/>
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteName(id)} disabled={!customNameMap[id]}>
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                    {editingId === id && editingType === type && (
                        <NamingForm
                            id={id}
                            currentName={customNameMap[id] || ''}
                            onSave={(name) => {
                                setName(id, name);
                                handleCancel();
                            }}
                            onCancel={handleCancel}
                            placeholder={`Enter name for ${placeholderPrefix} ${id}`}
                        />
                    )}
                </div>
            ))}
        </CardContent>
    );

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
                     <Button asChild variant="outline" size="sm">
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 space-y-8">
                 <Tabs defaultValue="blocks" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="blocks">Block Names</TabsTrigger>
                        <TabsTrigger value="elevators">Elevator Names</TabsTrigger>
                        <TabsTrigger value="floors">Floor Names</TabsTrigger>
                    </TabsList>
                    <TabsContent value="blocks">
                        <Card>
                             <CardHeader>
                                <CardTitle>Block Names</CardTitle>
                                <CardDescription>Assign custom names to building blocks. These names appear across the application.</CardDescription>
                            </CardHeader>
                            {renderNamingList(allBlockIds, 'block', getBlockName, setBlockName, deleteBlockName, customNames.blocks, "Block")}
                        </Card>
                    </TabsContent>
                    <TabsContent value="elevators">
                         <Card>
                             <CardHeader>
                                <CardTitle>Elevator Names</CardTitle>
                                <CardDescription>Assign custom names to individual elevators.</CardDescription>
                            </CardHeader>
                           {renderNamingList(allElevatorIds, 'elevator', getElevatorName, setElevatorName, deleteElevatorName, customNames.elevators, "Elevator")}
                        </Card>
                    </TabsContent>
                     <TabsContent value="floors">
                         <Card>
                             <CardHeader>
                                <CardTitle>Floor Names</CardTitle>
                                <CardDescription>Assign custom names to floor numbers (e.g., "G" for Ground, "L" for Lobby).</CardDescription>
                            </CardHeader>
                           {renderNamingList(allFloorIds, 'floor', getFloorName, setFloorName, deleteFloorName, customNames.floors, "Floor")}
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
