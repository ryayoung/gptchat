<script lang="ts">
import { tick, createEventDispatcher } from 'svelte';
import type { FileContentPart } from '$lib/core';
import PencilIcon from './icon/Pencil.svelte';
import TextArea from './TextArea.svelte';
import BinaryFile from './BinaryFile.svelte';
const dispatch = createEventDispatcher();
export let id: string;
export let contentText: string;
export let contentFiles: FileContentPart[];
export let generating: boolean;

let editing: boolean = false;

let editedContent: string = '';

function startEditing() {
    editedContent = contentText;
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
    dispatch('submit', { text: editedContent, id });
    stopEditing();
}

let textArea: TextArea | null = null;
</script>

<div class="sections-container">
    <div class="content-container  flex-col">
        {#each contentFiles as file}
            <div>
                {#if file.type === 'image_url'}
                    <img style="max-height: 12rem; width: auto; height: auto;" src={file.image_url.url} alt=Uploaded loading=lazy decoding=async/>
                {:else if file.type === 'binary'}
                    <BinaryFile name={file.name} style="margin: .5rem 0 1rem 0;"/>
                {/if}
            </div>
        {/each}
        {#if !editing}
            <div class="user-text  flex-col items-start gap.75 selectable-text-deep">
                {contentText}
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
                <button class="btn btn-primary" on:click={saveAndSubmit} disabled={generating}>
                    <div class="flex-center">Save & Submit</div>
                </button>
                <button class="btn btn-neutral" on:click={stopEditing}>
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

}
.user-text {
    word-wrap: break-word;
    white-space: pre-wrap;
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
