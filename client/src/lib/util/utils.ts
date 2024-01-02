import { v4 as uuidv4 } from 'uuid';

export function noop() {}
export const newId = uuidv4;

export function selectAllTextInElement(elem: HTMLElement) {
	elem.focus();
	const range = document.createRange();
	range.selectNodeContents(elem);
	const sel = window.getSelection();
	if (sel) {
		sel.removeAllRanges();
		sel.addRange(range);
	}
}


const pythonErrorRegex = /^\w*(Error|Exception|An error):/;
const pythonTracebackRegex = /^Traceback \(most recent call last\):/;

export function isPythonErrorString(s: string): boolean {
    return pythonErrorRegex.test(s) || pythonTracebackRegex.test(s);
}


export function elemIsScrollledToBottom(elem: HTMLElement): boolean {
    return elem.scrollHeight - elem.scrollTop <= elem.clientHeight;
}


export function appendOrReturnString(existing: string | null | undefined, toAppend: string): string {
    if (existing) {
        return existing + toAppend;
    }
    return toAppend;
}


/** The keys of T that are not undefined. */
type NonUndefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K
}[keyof T];

/** 
 * Function to create an object from an array of objects with a common
 * key that is never undefined. Type annotations assert that K not only
 * must be present on T, but that T[K] is never undefined.
 */
export function objectFromKeyedRecords<
    T extends RecordOf<any>,
    K extends NonUndefinedKeys<T>
>(array: T[], key: K): Record<T[K], T> {
    return array.reduce((obj, item) => {
        obj[item[key]] = item;
        return obj;
    }, {} as Record<T[K], T>);
}


export function refillArray<T>(array: T[], replacement: T[]): void {
    array.splice(0, array.length, ...replacement);
}
