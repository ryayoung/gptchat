<script lang="ts">
import { createEventDispatcher, onMount, tick } from 'svelte';
const dispatch = createEventDispatcher();
export let value: string;
export let style: string;
export let placeholder: string = '';
export let submitKeyMode: 'enter' | 'ctrl-enter' = 'enter';
export let maxHeight: number = 0;

$: maxHeightStyle = maxHeight ? `max-height: ${maxHeight}px;` : '';
$: inlineStyle = `${maxHeightStyle} ${style}`;

let checkSubmitKey: (e: KeyboardEvent) => boolean;
$: if (submitKeyMode === 'enter') {
    checkSubmitKey = (e) => e.key === 'Enter' && !e.shiftKey;
} else {
    checkSubmitKey = (e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey);
}

function handleKeyDown(e: KeyboardEvent) {
    if (checkSubmitKey(e)) {
        e.preventDefault();
        dispatch('submit');
        tick().then(setHeight);
    }
}

let setHeight: () => void;

$: if (maxHeight) {

    setHeight = () => {
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

} else {

    setHeight = () => {
        if (!elem) {
            return;
        }
        elem.style.overflowY = 'hidden';
        elem.style.height = 'auto';
        elem.style.height = elem.scrollHeight + 'px';
    }

}

onMount(() => setHeight());

function handleInput() {
    setHeight();
    dispatch('customchange', elem.value);
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
    style={inlineStyle}
    on:focus={setHeight}
    on:keydown={handleKeyDown}
    on:input={handleInput}
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
