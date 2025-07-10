
"use client";

import * as React from 'react';
import { useState } from 'react';
import { useNaming } from '@/hooks/use-naming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Building, Home, Save, Trash2, Info, Search } from 'lucide-react';
import Link from 'next/link';
import { NUM_BLOCKS, NUM_ELEVATORS_PER_BLOCK, MAX_FLOORS } from '@/lib/elevator-simulation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const allBlockIds = Array.from({ length: NUM_BLOCKS }, (_, i) => (i + 1).toString());
const allElevatorIds = Array.from({ length: NUM_BLOCKS }, (_, i) => {
    const blockId = i + 1;
    return Array.from({ length: NUM_ELEVATORS_PER_BLOCK }, (_, j) => `${blockId}-${j + 1}`);
}).flat();
const allFloorIds = Array.from({ length: MAX_FLOORS }, (_, i) => (i + 1).toString());

type NamingType = 'block' | 'elevator' | 'floor';

const NamingEditor = ({ 
    selectedId, 
    selectedType,
    currentName,
    customName,
    onSave,
    onDelete,
}: { 
    selectedId: string | null; 
    selectedType: NamingType | null;
    currentName: string;
    customName: string;
    onSave: (name: string) => void;
    onDelete: () => void;
}) => {
    const [name, setName] = useState(customName);

    React.useEffect(() => {
        setName(customName);
    }, [customName]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    };

    if (!selectedId || !selectedType) {
        return (
            <Card className="sticky top-24">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-48">
                    <Info className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-semibold">Select an item</p>
                    <p className="text-sm text-muted-foreground">Click an item from the list on the left to edit its name.</p>
                </CardContent>
            </Card>
        );
    }

    const typeLabels = {
        block: { title: "Block", idLabel: "Current Block Name", nameLabel: "Custom Block Name" },
        elevator: { title: "Elevator", idLabel: "Current Elevator Name", nameLabel: "Custom Elevator Name" },
        floor: { title: "Floor", idLabel: "Current Floor Name", nameLabel: "Custom Floor Name" },
    }
    const labels = typeLabels[selectedType];

    return (
        <Card className="sticky top-24">
             <CardHeader>
                <CardTitle>Edit {labels.title} Name</CardTitle>
                <CardDescription>Set a custom name for this item.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="itemId">{labels.idLabel}</Label>
                        <Input id="itemId" value={currentName} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="customName">{labels.nameLabel}</Label>
                        <Input 
                            id="customName" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder={`e.g. Lobby, Main Elevator...`}
                        />
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-2">
                        <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            Save Name
                        </Button>
                        <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600" onClick={onDelete} disabled={!customName}>
                           <Trash2 className="w-4 h-4 mr-2" />
                            Reset to Default
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function NamingPage() {
    const { 
        customNames, 
        getBlockName, getElevatorName, getFloorName,
        setBlockName, setElevatorName, setFloorName,
        deleteBlockName, deleteElevatorName, deleteFloorName
    } = useNaming();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<NamingType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelect = (id: string, type: NamingType) => {
        setSelectedId(id);
        setSelectedType(type);
    };

    const nameGetters: Record<NamingType, (id: string) => string> = {
        block: getBlockName,
        elevator: getElevatorName,
        floor: getFloorName,
    };
    const nameSetters: Record<NamingType, (id: string, name: string) => void> = {
        block: setBlockName,
        elevator: setElevatorName,
        floor: setFloorName,
    };
    const nameDeleters: Record<NamingType, (id: string) => void> = {
        block: deleteBlockName,
        elevator: deleteElevatorName,
        floor: deleteFloorName,
    };
     const customNameMaps: Record<NamingType, Record<string, string>> = {
        block: customNames.blocks,
        elevator: customNames.elevators,
        floor: customNames.floors,
    };

    const renderNamingList = (
        itemIds: string[], 
        type: NamingType
    ) => {
        const query = searchQuery.toLowerCase();
        const filteredIds = itemIds.filter(id => {
            if (!query) return true;
            const name = nameGetters[type](id).toLowerCase();
            return name.includes(query) || id.toLowerCase().includes(query);
        });

        return (
            <ScrollArea className="h-[58vh]">
                <div className="space-y-2 pr-4">
                    {filteredIds.map(id => (
                        <button 
                            key={id} 
                            onClick={() => handleSelect(id, type)}
                            className={cn(
                                "w-full text-center p-3 border rounded-lg transition-colors",
                                "hover:bg-muted/80",
                                selectedId === id && selectedType === type ? "bg-muted border-primary" : "bg-muted/40"
                            )}
                        >
                            <span className="font-medium truncate">{nameGetters[type](id)}</span>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        );
    }

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
            <main className="container mx-auto p-4 sm:p-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Filter by name or ID..."
                                        className="pl-10 w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Tabs defaultValue="blocks" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="blocks">Blocks</TabsTrigger>
                                        <TabsTrigger value="elevators">Elevators</TabsTrigger>
                                        <TabsTrigger value="floors">Floors</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="blocks" className="mt-4">
                                        {renderNamingList(allBlockIds, 'block')}
                                    </TabsContent>
                                    <TabsContent value="elevators" className="mt-4">
                                        {renderNamingList(allElevatorIds, 'elevator')}
                                    </TabsContent>
                                    <TabsContent value="floors" className="mt-4">
                                        {renderNamingList(allFloorIds, 'floor')}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                     <div className="md:col-span-2">
                        <NamingEditor 
                            selectedId={selectedId}
                            selectedType={selectedType}
                            currentName={selectedId && selectedType ? nameGetters[selectedType](selectedId) : ''}
                            customName={selectedId && selectedType ? customNameMaps[selectedType][selectedId] || '' : ''}
                            onSave={(name) => {
                                if (selectedId && selectedType) {
                                    nameSetters[selectedType](selectedId, name);
                                }
                            }}
                            onDelete={() => {
                                 if (selectedId && selectedType) {
                                    nameDeleters[selectedType](selectedId);
                                    handleSelect(selectedId, selectedType); // Reselect to refresh editor
                                }
                            }}
                        />
                    </div>
                 </div>
            </main>
        </div>
    );
}
