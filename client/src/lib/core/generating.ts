import * as util from '$lib/util';
import type { Socket } from './socket';
import type { ErrorStore } from './error';

export type GeneratingStore = util.Writable<boolean> & { 
};


export function createGeneratingStore() {
    const obj: GeneratingStore = {
        ...util.writable(false),
    };
    return obj;
}

export default createGeneratingStore;
