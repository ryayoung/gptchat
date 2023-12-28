<script lang="ts">
import { tick } from 'svelte';
import {
    messages,
    generating,
    regenerateOnUserMessage,
} from '$lib/main';
import PencilIcon from '$lib/icons/Pencil.svelte';
import TextArea from '$lib/chat/TextArea.svelte';
export let id: string;

let editing: boolean = false;

let editedContent: string = '';

function startEditing() {
    editedContent = content;
    editing = true;
    tick().then(() => {
        textArea?.focus();
    })
}

function stopEditing() {
    editedContent = '';
    editing = false;
}

function saveAndSubmit() {
    messages.update(store => {
        const msg = store[id];
        if (msg) {
            msg.content = editedContent;
        }
        return store;
    })
    stopEditing();
    regenerateOnUserMessage(id);
}

$: content = $messages[id]?.content ?? '';

let textArea: TextArea | null = null;
</script>

<div class="sections-container">
    <div class="content-container  flex-col">
        {#if !editing}
            <div class="user-text  flex-col items-start gap.75 selectable-text-deep">
                <div>{@html content}</div>
            </div>
        {:else}
            <TextArea
                bind:this={textArea}
                value={editedContent}
                on:customchange={(e) => editedContent = e.detail}
                style="min-height: 1.25rem; word-wrap: break-word; white-space: pre-wrap;"
                on:submit={saveAndSubmit}
                submitKeyMode="ctrl-enter"
            />
            <div class="editing-controls  flex justify-center gap.5">
                <button class="relative btn btn-primary" on:click={saveAndSubmit} disabled={$generating}>
                    <div class="flex-center">Save & Submit</div>
                </button>
                <button class="relative btn btn-neutral" on:click={stopEditing}>
                    <div class="flex-center">Cancel</div>
                </button>
            </div>
        {/if}
    </div>
    {#if !editing}
        <div class="controls  flex gap.75">
            <div class="buttons-container  flex gap.25">
                <button on:click={startEditing}>
                    <div class="icon-wrapper  flex items-center gap.375 text-xs">
                        <PencilIcon/>
                    </div>
                </button>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
@import '../../styles/pre.scss';

.content-container {
    max-width: 100%;

    .user-text {
        min-height: 1.25rem;
        word-wrap: break-word;
        white-space: pre-wrap;
        overflow-x: auto;
    }
}

.editing-controls {
    margin-top: .5rem;
    text-align: center;
}

.controls {
    margin-top: .25rem;
}

.buttons-container {
    color: color($gray-500);

    button {
        padding: .25rem .25rem .25rem 0;
        visibility: var(--button-visibility);

        &:hover {
            color: color($text-primary);
        }
    }
}
</style>
