export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debouncedFunction = function(this: ThisParameterType<T>, ...args: Parameters<T>): void {
        const later = () => {
            timeout = null;
            func.apply(this, args);
        };

        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, delay);
    };

    debouncedFunction.cancel = function(): void {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debouncedFunction as ((...args: Parameters<T>) => void) & { cancel: () => void };
}

export function throttleIgnore(
    func: (...args: Array<any>) => void,
    delay: number = 8
) {
    let lastCall = 0;
    return (...args: Array<any>) => {
        const now = new Date().getTime();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

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

import { Marked } from 'marked';
import hljs from 'highlight.js';

type HighlightedCode = {
    language: string
    code: string
}

function highlightCode(code: string, language: string): HighlightedCode {
    language = hljs.getLanguage(language) ? language : 'plaintext';
    code = hljs.highlight(code, { language }).value;
    return {
        language,
        code: `<code class="hljs language-${language}">${code}</code>`
    }
}

function parseCodePlain(rawCode: string, rawLanguage: string): string {
    const { code } = highlightCode(rawCode, rawLanguage);
    return `<pre class="markdown-code-block plain">${code}</pre>`;
}

function parseCodeWrapped(rawCode: string, rawLanguage: string): string {
    const { language, code } = highlightCode(rawCode, rawLanguage);
    if (language === 'plaintext') {
        return `<pre class="markdown-code-block plain">${code}</pre>`;
    }
    return `\
<div class="wrapped-code-container">
    <div class="lang-banner">
        <span>${language}</span>
    </div>
    <pre class="markdown-code-block wrapped">${code}</pre>
</div>`;
}


export function createMarkdownRenderer(wrapCode: boolean = false) {
    const marked = new Marked();
    const renderer = new marked.Renderer();
    if (wrapCode) {
        renderer.code = parseCodeWrapped;
    } else {
        renderer.code = parseCodePlain;
    }
    marked.setOptions({
        renderer: renderer,
    })
    return marked.parse.bind(marked) as (markdown: string) => string;
}

export const toMarkdown = createMarkdownRenderer(false);
export const toMarkdownWrappedCode = createMarkdownRenderer(true);


const pythonErrorRegex = /^\w*(Error|Exception|An error):/;
const pythonTracebackRegex = /^Traceback \(most recent call last\):/;

export function isPythonErrorString(s: string): boolean {
    return pythonErrorRegex.test(s) || pythonTracebackRegex.test(s);
}


export function elemIsScrollledToBottom(elem: HTMLElement): boolean {
    return elem.scrollHeight - elem.scrollTop <= elem.clientHeight;
}


type FileReadMethod = 'ArrayBuffer' | 'BinaryString' | 'Text' | 'DataURL';
type FileReadReturnTypeMap = {
    ArrayBuffer: ArrayBuffer
    BinaryString: string;
    Text: string;
    DataURL: string;
}
export function readFile<T extends FileReadMethod>(
    file: File,
    as: T
): Promise<FileReadReturnTypeMap[T]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            const data = e.target?.result;
            if (data !== null && data !== undefined) {
                resolve(data as FileReadReturnTypeMap[T]);
            } else {
                reject(new Error('File read resulted in null data'));
            }
        };
        reader.onerror = (e: ProgressEvent<FileReader>) => {
            reject(new Error(`Error reading file: ${e.target?.error?.message || 'Unknown error'}`));
        };
        reader[`readAs${as}`](file);
    })
}
