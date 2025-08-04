
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Building, GitCommitHorizontal, Upload, FileJson2, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackButton } from '@/components/back-button';
import { parseDataFrame } from '@/lib/data-frame-parser';
import type { FrameParseResult } from '@/types/parser';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ParserPage() {
    const [frameInput, setFrameInput] = useState('');
    const [lastResult, setLastResult] = useState<FrameParseResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [apiSuccess, setApiSuccess] = useState<string | null>(null);

    const handleParseAndSubmit = async () => {
        setIsLoading(true);
        setApiError(null);
        setApiSuccess(null);

        // Split by newline and filter out empty lines
        const frames = frameInput.split('\n').filter(f => f.trim() !== '');
        
        const allParsedData: any[] = [];
        let anyParseFailed = false;

        frames.forEach(frame => {
            const result = parseDataFrame(frame);
            if (result.success && result.data) {
                allParsedData.push(...result.data);
            } else {
                anyParseFailed = true;
                setLastResult(result); // Show the first error
            }
        });

        if (anyParseFailed) {
            setIsLoading(false);
            return;
        }

        // For display, just show the result of the first frame if successful
        if (frames.length > 0) {
            setLastResult(parseDataFrame(frames[0]));
        }

        if (allParsedData.length > 0) {
            try {
                const response = await fetch('/api/parser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(allParsedData),
                });

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.error || 'Failed to update elevators.');
                }
                
                setApiSuccess(responseData.message || 'Elevators updated successfully!');

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setApiError(errorMessage);
                console.error('API submission error:', error);
            }
        }
        
        setIsLoading(false);
    };

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
                        ElevateMS
                    </h1>
                    </Link>
                    <span className="text-xl sm:text-2xl text-muted-foreground">/</span>
                    <h2 className="text-lg sm:text-2xl font-semibold text-primary truncate flex items-center gap-2">
                        <GitCommitHorizontal />
                        Data Frame Parser
                    </h2>
                </div>
                <BackButton />
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>UDP Frame Input</CardTitle>
                            <CardDescription>
                                Paste one or more raw hexadecimal data frame strings from the hardware below, separated by new lines.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="e.g., 800501..."
                                className="h-48 font-mono text-xs"
                                value={frameInput}
                                onChange={(e) => setFrameInput(e.target.value)}
                            />
                            <Button onClick={handleParseAndSubmit} disabled={isLoading || !frameInput} className="w-full">
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
                                ) : (
                                    <><Upload className="mr-2 h-4 w-4" /> Parse & Update System</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Parsing Results</CardTitle>
                            <CardDescription>
                                The extracted data from the last submitted frame(s).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {lastResult ? (
                                <div className="space-y-4">
                                    {lastResult.success ? (
                                        <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4 !text-green-500" />
                                            <AlertTitle>Parse Successful</AlertTitle>
                                            <AlertDescription>
                                                Device ID: {lastResult.deviceId}. Found data for {lastResult.data?.length} elevators.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Alert variant="destructive">
                                            <XCircle className="h-4 w-4" />
                                            <AlertTitle>Parse Failed</AlertTitle>
                                            <AlertDescription>
                                                {lastResult.error}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {apiError && (
                                         <Alert variant="destructive">
                                            <XCircle className="h-4 w-4" />
                                            <AlertTitle>API Error</AlertTitle>
                                            <AlertDescription>{apiError}</AlertDescription>
                                        </Alert>
                                    )}
                                     {apiSuccess && (
                                        <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4 !text-green-500" />
                                            <AlertTitle>Update Success</AlertTitle>
                                            <AlertDescription>{apiSuccess}</AlertDescription>
                                        </Alert>
                                    )}

                                    {lastResult.success && lastResult.data && (
                                        <>
                                            <Separator />
                                            <h4 className="font-semibold flex items-center gap-2"><FileJson2 className="w-4 h-4" />Parsed Elevator Data (First Frame)</h4>
                                            <ScrollArea className="h-48 border rounded-lg p-2">
                                                <div className="space-y-3">
                                                {lastResult.data.map((d, i) => (
                                                    <div key={i} className="text-xs p-2 bg-muted/50 rounded-md font-mono">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold">Elevator (Slave) ID: {d.elevatorNum}</span>
                                                            <Badge variant={d.responseStatus === 'Positive' ? 'secondary' : 'destructive'} className="text-xs">{d.responseStatus}</Badge>
                                                        </div>
                                                        <p>Floor: {d.currentFloor}, Direction: {d.direction}, Door: {d.doorState}</p>
                                                        <p>Power: {d.mainPower ? 'ON' : 'OFF'}, E-Stop: {d.emergencyStop ? 'ON' : 'OFF'}</p>
                                                    </div>
                                                ))}
                                                </div>
                                            </ScrollArea>
                                        </>
                                    )}

                                </div>
                           ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Submit a data frame to see the results here.</p>
                                </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
