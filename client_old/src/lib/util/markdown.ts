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
    const markd = new Marked();
    const renderer = new markd.Renderer();
    if (wrapCode) {
        renderer.code = parseCodeWrapped;
    } else {
        renderer.code = parseCodePlain;
    }
    markd.setOptions({
        renderer: renderer,
    })
    return markd.parse.bind(markd) as (markdown: string) => string;
}

export const toMarkdown = createMarkdownRenderer(false);
export const toMarkdownWrappedCode = createMarkdownRenderer(true);
