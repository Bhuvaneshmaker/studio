
import type { ElevatorData } from '@/types/elevator';
import { ElevatorDetailClient } from '@/components/elevator-detail-client';
import { BackButton } from '@/components/back-button';

export const dynamic = 'force-dynamic';

async function getElevator(id: string): Promise<ElevatorData | null> {
    // In a real app, you would have a base URL in an env var
    const res = await fetch(`http://localhost:9002/api/elevators/${id}`, { cache: 'no-store' });
    if (!res.ok) {
        return null;
    }
    return res.json();
}

export default async function ElevatorDetailPage({ params }: { params: { id: string } }) {
    const elevator = await getElevator(params.id);

    if (!elevator) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">Elevator Not Found</h2>
                    <p className="text-muted-foreground">The requested elevator does not exist or could not be loaded.</p>
                     <div className="mt-4">
                        <BackButton />
                    </div>
                </div>
            </div>
        );
    }

    return <ElevatorDetailClient initialElevator={elevator} />;
}
