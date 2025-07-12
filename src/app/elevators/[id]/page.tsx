
import type { ElevatorData } from '@/types/elevator';
import { ElevatorDetailClient } from '@/components/elevator-detail-client';
import { BackButton } from '@/components/back-button';
import { getElevatorById } from '@/services/elevator-service';

export const dynamic = 'force-dynamic';

// Directly call the service function instead of using fetch with a hardcoded URL
async function getElevator(id: string): Promise<ElevatorData | null> {
    const elevator = getElevatorById(id);
    return elevator || null;
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
