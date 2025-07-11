
'use server';

import { revalidatePath } from 'next/cache';
import { 
    addBlock, 
    getElevatorData as getServiceData, 
    getElevatorById as getServiceElevatorById,
    setElevatorFault as setFault,
    resolveElevatorFault as resolveFault
} from './elevator-service';
import { setBlockName } from '@/lib/naming-actions';

export async function createBlockAction(formData: FormData) {
    const blockName = formData.get('blockName') as string;
    const numElevators = parseInt(formData.get('numElevators') as string, 10);

    if (blockName && !isNaN(numElevators)) {
        const newBlockId = addBlock(numElevators);
        await setBlockName(newBlockId, blockName);
        revalidatePath('/blocks');
    }
}

export async function getElevatorData() {
    return getServiceData();
}

export async function getElevatorById(id: string) {
    return getServiceElevatorById(id);
}

export async function triggerElevatorFaultAction(id: string, errorCode: number) {
    if (setFault(id, errorCode)) {
        revalidatePath(`/elevators/${id}`);
    }
}

export async function resolveElevatorFaultAction(id: string) {
    if (resolveFault(id)) {
        revalidatePath(`/elevators/${id}`);
    }
}
