import * as util from '../util';

export type GeneratingStore = util.Writable<boolean> & { 
};


export function createGeneratingStore() {
    const obj: GeneratingStore = {
        ...util.writable(false),
    };
    return obj;
}

export default createGeneratingStore;
