<script lang="ts">
import TextArea from './TextArea.svelte'
import SendIcon from './icon/Send.svelte'
import FileUploadIcon from './icon/FileUpload.svelte'

let { text, generating, allowUpload, placeholder, onchange, onsubmit, onupload, onstop, children } = $props<{
    text: string
    generating: boolean
    allowUpload: boolean
    placeholder: string
    onchange: (value: string) => void
    onsubmit: () => void
    onupload: () => void
    onstop: () => void
    children: any
}>()

setTimeout(() => textArea?.focus(), 50)

let textArea: TextArea
</script>

<div class="prompt-container flex justify-center w-full">
    <form class="prompt flex-col relative w-full">
        {@render children()}

        <TextArea
            bind:this={textArea}
            value={text}
            {onchange}
            {onsubmit}
            {placeholder}
            maxHeight={200}
            style="height: 3.25rem; padding: .875rem 3rem .875rem {allowUpload ? '3rem' : '.875rem'};"
        />
        {#if allowUpload}
            <button class="upload-btn bottom-left" type="button" onclick={onupload}>
                <FileUploadIcon />
            </button>
        {/if}
        {#if generating}
            <button class="stop-btn bottom-right rounded" type="button" onclick={onstop}>
                <div class="square" />
            </button>
        {:else}
            <button
                class="send-btn flex-center bottom-right"
                type="button"
                class:dimmed={text === ''}
                onclick={onsubmit}
            >
                <SendIcon />
            </button>
        {/if}
    </form>
</div>

<style lang="scss">
@import '../styles/pre.scss';

.bottom-left {
    @include absolute($left: 0.75rem, $bottom: 0.75rem);
}
.bottom-right {
    @include absolute($right: 0.75rem, $bottom: 0.75rem);
}

.prompt {
    max-width: 48rem;
    margin-bottom: 2rem;
    border-radius: 1rem;
    border: 1px solid color($border, 0.2);
    background-color: color($surface-primary);

    &:focus-within {
        box-shadow: 0 2px 6px color($black, 0.05);
        border-color: color($border, 0.25);
    }
}

.upload-btn {
    padding-bottom: 0.125rem;
}
.send-btn {
    @include square(1.75rem);
    background-color: color($bw-inverse);
    border-radius: 0.5rem;
    border: 1px solid color($bw-inverse);
    color: color($bw);

    transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);

    &.dimmed {
        opacity: 0.1;
    }
}

.stop-btn {
    padding: 0.5rem;
    background-color: color($bw-inverse);

    .square {
        @include square(0.75rem);
        background-color: color($surface-primary);
        border-radius: 1.5px;
    }
}
</style>
