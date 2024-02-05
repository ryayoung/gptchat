import { v4 as uuidv4 } from 'uuid'

export function noop() {}
export const newId = uuidv4

export function selectAllTextInElement(elem: HTMLElement) {
    elem.focus()
    const range = document.createRange()
    range.selectNodeContents(elem)
    const sel = window.getSelection()
    if (sel) {
        sel.removeAllRanges()
        sel.addRange(range)
    }
}

const pythonErrorRegex = /^\w*(Error|Exception|An error):/
const pythonTracebackRegex = /^Traceback \(most recent call last\):/

export function isPythonErrorString(s: string): boolean {
    return pythonErrorRegex.test(s) || pythonTracebackRegex.test(s)
}

// export function elemIsScrollledToBottom(elem: HTMLElement): boolean {
//     return elem.scrollHeight - elem.scrollTop <= elem.clientHeight
// }

// export function appendOrReturnString(existing: string | null | undefined, toAppend: string): string {
//     if (existing) {
//         return existing + toAppend
//     }
//     return toAppend
// }

/** The keys of T that are not undefined. */
type NonUndefinedKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K
}[keyof T]

/**
 * Function to create an object from an array of objects with a common
 * key that is never undefined. Type annotations assert that K not only
 * must be present on T, but that T[K] is never undefined.
 */
export function objectFromKeyedRecords<T extends RecordOf<any>, K extends NonUndefinedKeys<T>>(
    array: T[],
    key: K
): Record<T[K], T> {
    return array.reduce(
        (obj, item) => {
            obj[item[key]] = item
            return obj
        },
        {} as Record<T[K], T>
    )
}

export function refillArray<T>(array: T[], replacement: T[]): void {
    array.splice(0, array.length, ...replacement)
}

export function filterObject<T extends object>(obj: T, callback: (key: keyof T, value: T[keyof T]) => boolean): T {
    const result: Partial<T> = {}

    for (const key in obj) {
        const value = obj[key]
        if (callback(key as keyof T, value)) {
            result[key as keyof T] = value
        }
    }
    return result as T
}

/**
 * Given a potentially incomplete json string that could terminate at any character,
 * return a dict that includes all fully-complete key/value pairs from the string.
 *
 * Assumes that the string begins with valid json (i.e. an object or array) and only
 * may otherwise be invalid due to being incomplete. This function finds the point at
 * which the last valid, complete, key/value pair ends, and replaces the rest of the
 * string with the given `end_bracket`.
 */
export function parseIncompleteJson(string: string, endBracket: '}' | ']' = '}'): { [key: string]: any } | null {
    try {
        return JSON.parse(string)
    } catch (e) {}

    let idx = string.length

    while (idx > 0) {
        idx = string.lastIndexOf(',', idx - 1)

        if (idx === -1) {
            try {
                return JSON.parse(string + endBracket)
            } catch (e) {
                return null
            }
        }

        try {
            return JSON.parse(string.slice(0, idx) + endBracket)
        } catch (e) {}
    }

    return null
}

export function wrapInMarkdownCodeBlock(code: string, language: string = ''): string {
    return '```' + language + '\n' + code + '\n```'
}

export function prettifyJsonString(s: string): string {
    try {
        return JSON.stringify(JSON.parse(s), null, 2)
    } catch (e) {
        return s
    }
}

export function checkDarkModePreferred() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? true : false
}

export function changeHtmlClassList(op: 'add' | 'remove', ...tokens: string[]) {
    document.documentElement.classList[op](...tokens)
}

export function safeJsonParse<T>(s: string): T | null {
    try {
        return JSON.parse(s)
    } catch (e) {
        return null
    }
}

export function findLastTextNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
        return node
    }
    let lastTextNode = null
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
        lastTextNode = findLastTextNode(node.childNodes[i])
        if (lastTextNode && lastTextNode.textContent?.trim() !== '') {
            break
        }
    }
    return lastTextNode
}

const domParser = new DOMParser()

export function appendNodeAfterLastNonEmptyTextNode(markup: string, element: HTMLElement): string {
    const tree = domParser.parseFromString(markup, 'text/html').body
    ;(findLastTextNode(tree)?.parentNode as HTMLElement)?.appendChild(element)
    return tree.innerHTML
}
