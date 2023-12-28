<script lang="ts">
import {
    sendMessage, 
    generating, 
    prompt, 
    fileUploads, 
    uploadFile,
    stopGenerating,
} from '$lib/main';
import TextArea from '$lib/chat/TextArea.svelte';
import SendIcon from '$lib/icons/Send.svelte';
import FileUploadIcon from '$lib/icons/FileUpload.svelte';

setTimeout(() => textArea?.focus(), 50);

let textArea: TextArea;
</script>

<div class="prompt-container  flex justify-center w-full">
    <form class="prompt  flex-col relative w-full">
        {#if $fileUploads.length > 0}
            <div class="file-uploads  flex flex-wrap gap.5 text-sm">
                {#each $fileUploads as { type, id, name } (id)}
                    <div class="file-item  inline-flex items-center gap.5 relative">
                        <div class="icon codicon {type === 'image' ? 'codicon-device-camera' : 'codicon-file'}"/>
                        <span>{name}</span>
                        <button on:click={() => $fileUploads = $fileUploads.filter(f => f.id !== id)}>
                            <div class="codicon codicon-close"/>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
        <TextArea
            bind:this={textArea}
            value={$prompt}
            on:customchange={(e) => $prompt = e.detail}
            placeholder="Send a message..."
            on:submit={sendMessage}
            maxHeight={200}
            style="height: 3.25rem; padding: .875rem 3rem .875rem 3rem;"
        />
        <button class="upload-btn  bottom-left" on:click={uploadFile}>
            <FileUploadIcon/>
        </button>
        {#if $generating}
            <button class="stop-btn  bottom-right rounded" on:click={stopGenerating}>
                <div class="square"/>
            </button>
        {:else}
            <button class="send-btn  flex-center bottom-right" class:dimmed={$prompt === ''} on:click={sendMessage}>
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

.file-uploads {
    padding: .5rem .5rem 0 .5rem;
}
.file-item {
    border-radius: .75rem;
    border-width: 1px;
    padding: .5rem;
    min-width: 12rem;
    --button-visibility: hidden;

    &:hover {
        --button-visibility: visible;
    }

    .icon {
        padding: .375rem;
        border-radius: .375rem;
        background-color: color($accent-darker);
    }
    span {
        font-weight: 500;
        flex: 1;
    }
    button {
        padding: .125rem;
        visibility: var(--button-visibility);
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
