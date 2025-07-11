
import type { ElevatorData } from '@/types/elevator';
import { getElevatorById } from '@/services/elevator-actions';
import { ElevatorDetailClient } from '@/components/elevator-detail-client';
import { BackButton } from '@/components/back-button';

export const dynamic = 'force-dynamic';

export default async function ElevatorDetailPage({ params: { id } }: { params: { id: string } }) {
    const elevator = await getElevatorById(id);

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

    return <ElevatorDetailClient elevator={elevator} />;
}
