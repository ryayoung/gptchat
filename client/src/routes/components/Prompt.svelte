<script lang="ts">
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();
import TextArea from './TextArea.svelte';
import SendIcon from './icon/Send.svelte';
import FileUploadIcon from './icon/FileUpload.svelte';

export let text: string;
export let generating: boolean;

setTimeout(() => textArea?.focus(), 50);

let textArea: TextArea;
</script>

<div class="prompt-container  flex justify-center w-full">
    <form class="prompt  flex-col relative w-full">

        <slot/>

        <TextArea
            bind:this={textArea}
            value={text}
            on:customchange={(e) => dispatch('customchange', e.detail)}
            placeholder="Send a message..."
            on:submit={() => dispatch('submit')}
            maxHeight={200}
            style="height: 3.25rem; padding: .875rem 3rem .875rem 3rem;"
        />
        <button class="upload-btn  bottom-left" on:click={() => dispatch('upload')}>
            <FileUploadIcon/>
        </button>
        {#if generating}
            <button class="stop-btn  bottom-right rounded" on:click={() => dispatch('stop')}>
                <div class="square"/>
            </button>
        {:else}
            <button class="send-btn  flex-center bottom-right" class:dimmed={text === ''} on:click={() => dispatch('submit')}>
                <SendIcon/>
            </button>
        {/if}
    </form>
</div>

<style lang="scss">
@import '../../styles/pre.scss';

.bottom-left {
    @include absolute($left: .75rem, $bottom: .75rem);
}
.bottom-right {
    @include absolute($right: .75rem, $bottom: .75rem);
}

.prompt {
    max-width: 48rem;
    margin-bottom: 2rem;
    border-radius: 1rem;
    border: 1px solid color($border, .2);
    background-color: color($surface-primary);

    &:focus-within {
        box-shadow: 0 2px 6px color($black, .05);
        border-color: color($border, .25);
    }
}

.upload-btn {
    padding-bottom: .125rem;
}
.send-btn {
    @include square(1.75rem);
    background-color: color($bw-inverse);
    border-radius: 0.5rem;
    border: 1px solid color($bw-inverse);
    color: color($bw);

    transition: opacity .15s cubic-bezier(.4,0,.2,1);

    &.dimmed {
        opacity: 0.1;
    }
}

.stop-btn {
    padding: .5rem;
    background-color: color($bw-inverse);

    .square {
        @include square(.75rem);
        background-color: color($surface-primary);
        border-radius: 1.5px;
    }
}
</style>
