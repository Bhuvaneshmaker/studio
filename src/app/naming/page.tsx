
"use client";

import * as React from 'react';
import { useState } from 'react';
import { useNaming } from '@/hooks/use-naming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Building, Home, Save, Trash2, Info, Search, Router, SlidersHorizontal, MapPin } from 'lucide-react';
import Link from 'next/link';
import { NUM_SLAVES_PER_DEVICE, MAX_FLOORS, NUM_DEVICES } from '@/lib/elevator-simulation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const allDeviceIps = Array.from({ length: NUM_DEVICES }, (_, i) => `192.168.1.${10 + i}`);
const allSlaveIds = Array.from({ length: NUM_DEVICES }, (_, i) => {
    const ip = `192.168.1.${10 + i}`;
    return Array.from({ length: NUM_SLAVES_PER_DEVICE }, (_, j) => `${ip}-${j + 1}`);
}).flat();
const allFloorIds = Array.from({ length: MAX_FLOORS }, (_, i) => (i + 1).toString());

type NamingType = 'device' | 'slave' | 'floor';

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
                    <p className="text-sm text-muted-foreground">Click an item from the list to edit its name.</p>
                </CardContent>
            </Card>
        );
    }

    const typeLabels = {
        device: { title: "Device", idLabel: "Current Device Name", nameLabel: "Custom Device Name" },
        slave: { title: "Slave", idLabel: "Current Slave Name", nameLabel: "Custom Slave Name" },
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
                            placeholder={`e.g. Main PLC, Lobby, Slave 5...`}
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
        getDeviceName, getSlaveName, getFloorName,
        setDeviceName, setSlaveName, setFloorName,
        deleteDeviceName, deleteSlaveName, deleteFloorName
    } = useNaming();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<NamingType>('device');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelect = (id: string, type: NamingType) => {
        setSelectedId(id);
        setSelectedType(type);
    };

    const handleTabChange = (value: string) => {
        setSelectedId(null);
        setSelectedType(value as NamingType);
        setSearchQuery('');
    }

    const nameGetters: Record<NamingType, (id: string) => string> = {
        device: getDeviceName,
        slave: getSlaveName,
        floor: getFloorName,
    };
    const nameSetters: Record<NamingType, (id: string, name: string) => void> = {
        device: setDeviceName,
        slave: setSlaveName,
        floor: setFloorName,
    };
    const nameDeleters: Record<NamingType, (id: string) => void> = {
        device: deleteDeviceName,
        slave: deleteSlaveName,
        floor: deleteFloorName,
    };
     const customNameMaps: Record<NamingType, Record<string, string>> = {
        device: customNames.devices,
        slave: customNames.slaves,
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

            // For slaves, also check device IP part of the ID
            if (type === 'slave') {
              const deviceIp = id.split('-')[0].toLowerCase();
              return name.includes(query) || idLower.includes(query) || deviceIp.includes(query)
            }
            return name.includes(query) || idLower.includes(query);
        });

        return (
            <ScrollArea className="h-[calc(100vh-280px)]">
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
                <Tabs defaultValue="device" className="w-full mb-6" onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-3 h-12 text-base">
                        <TabsTrigger value="device"><Router className="mr-2"/>Devices</TabsTrigger>
                        <TabsTrigger value="slave"><SlidersHorizontal className="mr-2"/>Slaves</TabsTrigger>
                        <TabsTrigger value="floor"><MapPin className="mr-2"/>Floors</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                       <Card>
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
                                {selectedType === 'device' && renderNamingList(allDeviceIps, 'device')}
                                {selectedType === 'slave' && renderNamingList(allSlaveIds, 'slave')}
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
