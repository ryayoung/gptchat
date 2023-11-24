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

import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();

renderer.code = (code: string, language: string) => {
    const validLang = hljs.getLanguage(language) ? language : 'plaintext';
    const highlightedCode = hljs.highlight(code, { language: validLang }).value;

    return `<pre class="markdown-code-block"><code class="hljs language-${validLang}">${highlightedCode}</code></pre>`;
}

export const markedOptions = {
    renderer: renderer,
    mangle: false,
    headerIds: false,
};

marked.setOptions(markedOptions);

export function toMarkdown(rawText: string | null): string {
    if (rawText === null) return '';
    // Keeping this as a separate function in case of future changes
    return marked(rawText);
}


const pythonErrorRegex = /^\w*(Error|Exception|An error):/;
const pythonTracebackRegex = /^Traceback \(most recent call last\):/;

export function isPythonErrorString(s: string): boolean {
    return pythonErrorRegex.test(s) || pythonTracebackRegex.test(s);
}


export function elemIsScrollledToBottom(elem: HTMLElement): boolean {
    return elem.scrollHeight - elem.scrollTop <= elem.clientHeight;
}
