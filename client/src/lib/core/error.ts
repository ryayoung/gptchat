import * as util from '../util';

export const errorsToShow: Record<CustomError['type'], boolean> = {
    Server: true,
    Client: true,
}

export type CustomError = {
    type: 'Server' | 'Client'
    text: string
}
export type ErrorStore = util.Writable<CustomError[]> & {
    showType(type: CustomError['type']): boolean
    remove(text: string): void
    add(type: 'Server' | 'Client', text: string): void
};

export function createErrorStore() {
    const obj: ErrorStore = {
        ...util.writable([]),

        showType(type) {
            return errorsToShow[type];
        },

        remove(text) {
            this.update(errs => errs.filter(e => e.text !== text));
        },

        add(type, text) {
            if (!this.get().some(e => e.text === text)) {
                console.error(`${type} Error: ${text}`);
                this.update(errs => {
                    errs.push({ type, text });
                    return errs;
                })
            }
        }
    }
    return obj;
}

export default createErrorStore;
