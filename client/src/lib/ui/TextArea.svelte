<script lang="ts">
import { onMount, createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();
export let totalWidth: number | null = null;
export let value: string;
export let maxHeight: number | null = null;
export let style: string = '';
export let disabled: boolean = false;
export let placeholder: string = '';

export function focus() {
    elem?.focus();
}
export function selectEnd() {
    const len = elem.value.length;
    elem.focus();
    elem.selectionStart = len;
    elem.selectionEnd = len;
}
export function selectStart() {
    elem.focus();
    elem.selectionStart = 0;
    elem.selectionEnd = 0;
}

function setHeight() {
    if (elem) {
        if (maxHeight && elem.scrollHeight > maxHeight) {
            elem.style.overflowY = 'scroll';
            elem.style.height = maxHeight + 'px';
        } else {
            elem.style.overflowY = 'hidden';
            elem.style.height = 'auto';
            elem.style.height = elem.scrollHeight + 'px';
        }
    }
}

function handleInput() {
    setHeight();
    dispatch('customchange', elem!.value);
}

$: if (totalWidth !== null) {
    setHeight();
}
onMount(() => setHeight())


export function valueIsEmpty(): boolean {
    return elem.value === '';
}
export function noHighlightedText(): boolean {
    return elem.selectionStart === elem.selectionEnd;
}
export function selectionIsAtStart(): boolean {
    return noHighlightedText() && elem.selectionStart === 0;
}
export function selectionIsAtEnd(): boolean {
    return noHighlightedText() && elem.selectionEnd === elem.value.length;
}

let elem: HTMLTextAreaElement;
</script>

<textarea
    {style}
    {disabled}
    {placeholder}
    autocorrect = off
    autocomplete = off
    autocapitalize = off
    spellcheck = false
    bind:this={elem}
    value={value}
    on:input={handleInput}
    on:keydown
    on:keydown={e => {
        if (valueIsEmpty() && e.key === 'Backspace') {
            e.preventDefault();
            return dispatch('backspaceWhileEmpty');
        } else if (e.key === 'ArrowLeft' && selectionIsAtStart()) {
            e.preventDefault();
            return dispatch('arrowPrevious');
        } else if (e.key === 'ArrowRight' && selectionIsAtEnd()) {
            e.preventDefault();
            return dispatch('arrowNext');
        }
    }}
    rows="1"
/>


<style lang="scss">

textarea {
    overflow-y: hidden;
    resize: none;
    width: 100%;
    outline: none;
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5rem;
    border-width: 0;
    background: none;

    &::placeholder {
        color: var(--color-fg-muted);
        opacity: 0.6
    }
}
</style>
