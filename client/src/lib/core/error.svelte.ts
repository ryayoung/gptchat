import * as util from '../util';

export const errorsToShow: Record<CustomError['type'], boolean> = {
    Server: true,
    Client: true,
}

export type CustomError = {
    type: 'Server' | 'Client'
    text: string
}
export type ErrorStore = {
    items: CustomError[]
    showType(type: CustomError['type']): boolean
    remove(text: string): void
    add(type: 'Server' | 'Client', text: string): void
};

export function createErrorStore() {

    let items = $state<CustomError[]>([])

    function showType(type: CustomError['type']): boolean {
        return errorsToShow[type]
    }

    function remove(text: string) {
        util.refillArray(items, items.filter(e => e.text !== text))
    }

    function add(type: CustomError['type'], text: string) {
        if (!items.some(e => e.text === text)) {
            console.error(`${type} Error: ${text}`)
            items.push({ type, text })
        }
    }

    return { items, showType, remove, add }

    // const obj: ErrorStore = {
    //     ...util.writable([]),
    //
    //     showType(type) {
    //         return errorsToShow[type];
    //     },
    //
    //     remove(text) {
    //         this.update(errs => errs.filter(e => e.text !== text));
    //     },
    //
    //     add(type, text) {
    //         if (!this.get().some(e => e.text === text)) {
    //             console.error(`${type} Error: ${text}`);
    //             this.update(errs => {
    //                 errs.push({ type, text });
    //                 return errs;
    //             })
    //         }
    //     }
    // }
    // return obj;
}

export default createErrorStore;
