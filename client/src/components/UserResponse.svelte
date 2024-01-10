<script lang="ts">
import { tick } from 'svelte'
import type { BinaryContentPart } from '../lib/core/index.svelte'
import type { ImageContentPart } from '../lib/core/openai'
import PencilIcon from './icon/Pencil.svelte'
import TextArea from './TextArea.svelte'
import BinaryFile from './BinaryFile.svelte'

let { contentText: text, contentImages: images, contentBinaries: binaries, generating, onsubmit: onsubmitProp } = $props<{
    contentText: string;
    contentImages: ImageContentPart[];
    contentBinaries: BinaryContentPart[];
    generating: boolean;
    onsubmit: (text: string) => void;
}>();

let editing: boolean = $state(false);

let editedText: string = $state('');

function startEditing() {
    editedText = text;
    editing = true;
    tick().then(() => {
        textArea?.focus();
    })
}

function stopEditing() {
    editedText = '';
    editing = false;
}

function onsubmit() {
    onsubmitProp(editedText);
    stopEditing();
}

let textArea: TextArea | null = null;
</script>

<div class="content-container  flex-col">
    {#if images.length > 0}
        <div class="images-container  flex flex-wrap gap.5">
            {#each images as { image_url: { url: src } }}
                <div class="image-item  overflow-hidden">
                    <img {src} style="max-height: 12rem; width: auto; height: auto;" alt=Uploaded loading=lazy decoding=async/>
                </div>
            {/each}
        </div>
    {/if}
    {#if binaries.length > 0}
        <div class="binaries-container  flex flex-wrap gap.5">
            {#each binaries as { name }}
                <div>
                    <BinaryFile {name}/>
                </div>
            {/each}
        </div>
    {/if}
    {#if !editing}
        <div class="user-text  flex-col items-start gap.75 selectable-text-deep">
            {text}
        </div>
    {:else}
        <TextArea
            bind:this={textArea}
            value={editedText}
            onchange={text => editedText = text}
            style="min-height: 1.25rem; word-wrap: break-word; white-space: pre-wrap; width: 100%;"
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

.images-container, .binaries-container {
    margin: .5rem 0 .5rem 0;
}

.image-item {
    border-radius: .75rem;
    border-width: 1px;
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
