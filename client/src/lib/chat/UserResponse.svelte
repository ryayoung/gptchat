<script lang="ts">
import { tick } from 'svelte';
import {
    messages,
    regenerateOnUserMessage,
} from '$lib/main';
import PencilIcon from '$lib/icons/PencilIcon.svelte';
import TextArea from '$lib/ui/TextArea.svelte';
export let id: string;

let editing: boolean = false;

let editedContent: string = '';

function startEditing() {
    editedContent = content;
    editing = true;
    tick().then(() => {
        textArea?.selectEnd();
    })
}

function stopEditing() {
    editedContent = '';
    editing = false;
}

function saveAndSubmit() {
    const msg = $messages[id];
    if (msg) {
        msg.content = editedContent;
    }
    stopEditing();
    regenerateOnUserMessage(id);
}

$: content = $messages[id]?.content ?? '';

let textArea: TextArea | null = null;
</script>

<div class="sections-container">
    <div class="content-container">
        {#if !editing}
            <div class="user-text selectable-text-deep">
                <div>{@html content}</div>
            </div>
        {:else}
            <TextArea
                bind:this={textArea}
                value={editedContent}
                on:customchange={(e) => editedContent = e.detail}
                style="min-height: 1.25rem; word-wrap: break-word; white-space: pre-wrap;"
                on:keydown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        saveAndSubmit();
                    }
                }}
            />
            <div class="editing-controls">
                <button class="save" on:click={saveAndSubmit}>
                    <div>Save & Submit</div>
                </button>
                <button class="cancel" on:click={stopEditing}>
                    <div>Cancel</div>
                </button>
            </div>
        {/if}
    </div>
    {#if !editing}
        <div class="controls">
            <div class="buttons-container">
                <button
                    on:click={startEditing}
                >
                    <div class="icon-wrapper">
                        <PencilIcon/>
                    </div>
                </button>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">

.content-container {
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;

    .user-text {
        min-height: 1.25rem;
        word-wrap: break-word;
        white-space: pre-wrap;
        overflow-x: auto;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: .75rem;
    }

}

.editing-controls {
    margin-top: .5rem;
    display: flex;
    justify-content: center;
    text-align: center;
    font-size: 1rem;
    line-height: 1.5rem;

    button {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        font-size: .875rem;
        font-weight: 500;
        line-height: 1.25rem;
        padding: .5rem .75rem;
        pointer-events: auto;
        border: 1px solid transparent;
        border-radius: .5rem;

        div {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: .5rem;
            width: 100%;
        }
    }

    button.save {
        position: relative;
        background-color: var(--color-accent-fg-darker);
        color: white;
        margin-right: .5rem;

        &:hover {
            background-color: var(--color-accent-fg-darkest);
        }
    }

    button.cancel {
        border-color: rgba(0,0,0,.1);
        background: none;

        &:hover {
            background-color: rgb(247,247,248);
        }
    }
}

.controls {
    margin-top: .25rem;
    display: flex;
    justify-content: flex-start;
    gap: .75rem;
}

.buttons-container {
    display: flex;
    justify-content: flex-start;
    gap: .25rem;
    color: rgb(172,172,190);
    margin-top: 0;

    button {
        padding: .25rem;
        padding-left: 0;
        cursor: pointer;
        visibility: var(--button-visibility);
        background: none;
        border: none;

        &:hover {
            color: rgb(5,5,9);
        }

        .icon-wrapper {
            display: flex;
            align-items: center;
            gap: .375rem;
            font-size: .75rem;
            line-height: 1rem;
        }
    }
}
</style>
