<script lang="ts">
import { tick } from 'svelte';
import type { FileContentPart } from '../lib/core';
import PencilIcon from './icon/Pencil.svelte';
import TextArea from './TextArea.svelte';
import BinaryFile from './BinaryFile.svelte';

let { contentText, contentFiles, generating, onsubmit: onsubmitProp } = $props<{
    contentText: string;
    contentFiles: FileContentPart[];
    generating: boolean;
    onsubmit: (text: string) => void;
}>();

let editing: boolean = $state(false);

let editedContent: string = $state('');

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

function onsubmit() {
    onsubmitProp(editedContent);
    stopEditing();
}

let textArea: TextArea | null = null;
</script>

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
            onchange={text => editedContent = text}
            style="min-height: 1.25rem; word-wrap: break-word; white-space: pre-wrap;"
            {onsubmit}
            submitKeyMode="ctrl-enter"
        />
        <div class="editing-controls  flex justify-center gap.5">
            <button class="btn btn-primary" onclick={onsubmit} disabled={generating}>
                <div class="flex-center">Save & Submit</div>
            </button>
            <button class="btn btn-neutral" onclick={stopEditing}>
                <div class="flex-center">Cancel</div>
            </button>
        </div>
    {/if}
</div>
{#if !editing}
    <div class="controls  flex gap.75">
        <div class="buttons-container  flex gap.25">
            <button onclick={startEditing}>
                <div class="icon-wrapper  flex items-center gap.375 text-xs">
                    <PencilIcon/>
                </div>
            </button>
        </div>
    </div>
{/if}

<style lang="scss">
@import '../styles/pre.scss';

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
