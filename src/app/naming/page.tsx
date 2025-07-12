
"use client";

import * as React from 'react';
import { useState } from 'react';
import { useNaming } from '@/hooks/use-naming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Building, Home, Save, Trash2, Info, Search, Server, SlidersHorizontal, MapPin } from 'lucide-react';
import Link from 'next/link';
import { NUM_ELEVATORS_PER_BLOCK, MAX_FLOORS, NUM_BLOCKS } from '@/lib/elevator-simulation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BackButton } from '@/components/back-button';

const allDeviceIds = Array.from({ length: NUM_BLOCKS }, (_, i) => (i + 1).toString());
const allElevatorIds = Array.from({ length: NUM_BLOCKS }, (_, i) => {
    return Array.from({ length: NUM_ELEVATORS_PER_BLOCK }, (_, j) => `${i + 1}-${j + 1}`);
}).flat();
const allFloorIds = Array.from({ length: MAX_FLOORS }, (_, i) => (i + 1).toString());

type NamingType = 'device' | 'elevator' | 'floor';

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
    }, [customName, selectedId]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name);
    };

    if (!selectedId || !selectedType) {
        return (
            <Card className="sticky top-24 shadow-lg">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-48">
                    <Info className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-semibold">Select an item</p>
                    <p className="text-sm text-muted-foreground">Click an item from the list to edit its name.</p>
                </CardContent>
            </Card>
        );
    }

    const typeLabels = {
        device: { title: "Device (Teensy)", idLabel: "Current Device Name", nameLabel: "Custom Device Name" },
        elevator: { title: "Elevator / Slave", idLabel: "Current Elevator Name", nameLabel: "Custom Elevator Name" },
        floor: { title: "Floor", idLabel: "Current Floor Name", nameLabel: "Custom Floor Name" },
    }
    const labels = typeLabels[selectedType];

    return (
        <Card className="sticky top-24 shadow-lg">
             <CardHeader>
                <CardTitle>Edit {labels.title} Name</CardTitle>
                <CardDescription>Set a friendly, custom name for this item.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="itemId">{labels.idLabel}</Label>
                        <Input id="itemId" value={currentName} disabled className="bg-muted/50" />
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
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
                        <Button type="submit" className="w-full sm:w-auto">
                            <Save className="w-4 h-4 mr-2" />
                            Save Name
                        </Button>
                        <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 w-full sm:w-auto" onClick={onDelete} disabled={!customName}>
                           <Trash2 className="w-4 h-4 mr-2" />
                            Reset Name
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
        getDeviceName, getElevatorName, getFloorName,
        setDeviceName, setElevatorName, setFloorName,
        deleteDeviceName, deleteElevatorName, deleteFloorName
    } = useNaming();

    const [selectedId, setSelectedId] = useState<string | null>(allDeviceIds[0]);
    const [selectedType, setSelectedType] = useState<NamingType>('device');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelect = (id: string, type: NamingType) => {
        setSelectedId(id);
        setSelectedType(type);
    };

    const handleTabChange = (value: string) => {
        const newType = value as NamingType;
        setSelectedType(newType);
        setSearchQuery('');
        // Select the first item of the new type
        if (newType === 'device') setSelectedId(allDeviceIds[0]);
        else if (newType === 'elevator') setSelectedId(allElevatorIds[0]);
        else if (newType === 'floor') setSelectedId(allFloorIds[0]);
        else setSelectedId(null);
    }

    const nameGetters: Record<NamingType, (id: string) => string> = {
        device: getDeviceName,
        elevator: getElevatorName,
        floor: getFloorName,
    };
    const nameSetters: Record<NamingType, (id: string, name: string) => void> = {
        device: setDeviceName,
        elevator: setElevatorName,
        floor: setFloorName,
    };
    const nameDeleters: Record<NamingType, (id: string) => void> = {
        device: deleteDeviceName,
        elevator: deleteElevatorName,
        floor: deleteFloorName,
    };
     const customNameMaps: Record<NamingType, Record<string, string>> = {
        device: customNames.devices,
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
            const idLower = id.toLowerCase();
            return name.includes(query) || idLower.includes(query);
        });

        return (
            <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="space-y-2 pr-4">
                    {filteredIds.map(id => (
                        <button 
                            key={id} 
                            onClick={() => handleSelect(id, type)}
                            className={cn(
                                "w-full text-left p-3 border rounded-lg transition-colors text-sm",
                                "hover:bg-muted/80 hover:border-primary/30",
                                selectedId === id && selectedType === type ? "bg-muted border-primary ring-2 ring-primary/20" : "bg-muted/40"
                            )}
                        >
                            <span className="font-medium truncate block">{nameGetters[type](id)}</span>
                            {nameGetters[type](id).toLowerCase() !== id.toLowerCase() && (
                                <span className="text-xs text-muted-foreground">ID: {id}</span>
                            )}
                        </button>
                    ))}
                     {filteredIds.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No items found for "{searchQuery}".</p>
                        </div>
                    )}
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
                                <Building className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <h1 className="text-xl sm:text-3xl font-bold text-primary font-headline hidden sm:block">
                                ElevateView
                            </h1>
                        </Link>
                        <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
                        <h2 className="text-lg sm:text-2xl font-semibold text-primary truncate">
                            Manage Naming
                        </h2>
                    </div>
                     <BackButton />
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6">
                <Tabs defaultValue="device" className="w-full mb-6" onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-3 h-12 text-base">
                        <TabsTrigger value="device"><Server className="mr-2"/>Devices</TabsTrigger>
                        <TabsTrigger value="elevator"><SlidersHorizontal className="mr-2"/>Elevators / Slaves</TabsTrigger>
                        <TabsTrigger value="floor"><MapPin className="mr-2"/>Floors</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                       <Card className="shadow-lg">
                           <CardContent className="pt-6 space-y-4">
                               <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Filter by name or ID..."
                                        className="pl-10 w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                {selectedType === 'device' && renderNamingList(allDeviceIds, 'device')}
                                {selectedType === 'elevator' && renderNamingList(allElevatorIds, 'elevator')}
                                {selectedType === 'floor' && renderNamingList(allFloorIds, 'floor')}
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
                                    // re-select to refresh editor state
                                    handleSelect(selectedId, selectedType); 
                                }
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
