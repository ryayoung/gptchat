<script lang="ts">
import { tick } from 'svelte';
let { value, style: styleProp = '', placeholder = '', submitKeyMode = 'enter', maxHeight = 0, onchange: onchangeProp, onsubmit: onsubmitProp } = $props<{
    value?: string
    style?: string
    placeholder?: string
    submitKeyMode?: 'enter' | 'ctrl-enter'
    maxHeight?: number
    onchange: (value: string) => void
    onsubmit: () => void
}>();

let maxHeightStyle = $derived(maxHeight ? `max-height: ${maxHeight}px;` : '');
let style = $derived(`${maxHeightStyle} ${styleProp}`);

let checkSubmitKey: (e: KeyboardEvent) => boolean = $derived(
    submitKeyMode === 'enter'
        ? (e) => e.key === 'Enter' && !e.shiftKey
        : (e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey)
)

function onkeydown(e: KeyboardEvent) {
    if (checkSubmitKey(e)) {
        e.preventDefault();
        onsubmitProp()
        tick().then(setHeight);
    }
}

function setHeightFromMaxHeight(maxHeight: number) {
    if (!elem) {
        return;
    }
    if (elem.scrollHeight > maxHeight) {
        elem.style.overflowY = 'scroll';
        elem.style.height = maxHeight + 'px';
    } else {
        elem.style.overflowY = 'hidden';
        elem.style.height = 'auto';
        elem.style.height = elem.scrollHeight + 'px';
    }
}

function setHeightAuto() {
    if (!elem) {
        return
    }
    elem.style.overflowY = 'hidden';
    elem.style.height = 'auto';
    elem.style.height = elem.scrollHeight + 'px';
}

let setHeight: () => void = $derived(
    maxHeight ? () => setHeightFromMaxHeight(maxHeight) : setHeightAuto
)


$effect(() => setHeight());

function oninput() {
    setHeight();
    onchangeProp(elem.value);
}

function onfocus() {
    setHeight();
}

export function focus() {
    elem?.focus();
}

let elem: HTMLTextAreaElement;
</script>

<textarea
    bind:this={elem}
    autocorrect = off
    autocomplete = off
    autocapitalize = off
    spellcheck = false
    {value}
    {placeholder}
    {style}
    {onfocus}
    {onkeydown}
    {oninput}
    rows="1"
/>

<style lang="scss">
textarea {
    overflow-y: hidden;
    resize: none;
    width: 100%;
    outline: none;
    border-width: 0;
    background: none;
}
</style>
