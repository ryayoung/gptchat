import * as util from '$lib/util';

const CLASS = 'dark';

export type DarkModeStore = util.Writable<boolean> & {
    checkDarkModePreferred(): boolean
    updateDocument(val: boolean): void
}

export function createDarkModeStore() {
    const obj: DarkModeStore = {
        ...util.writable(false),
        checkDarkModePreferred() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? true : false;
        },
        updateDocument(val) {
            document.documentElement.classList[val ? 'add' : 'remove'](CLASS);
        },
    }

    obj.subscribe(obj.updateDocument.bind(obj));
    obj.set(obj.checkDarkModePreferred());

    return obj;
}

export default createDarkModeStore;
