<script lang="ts">
import { sendMessage, generating, prompt, promptSendMode, stopGenerating } from '$lib/main';
import TextArea from '$lib/ui/TextArea.svelte';
import SendIcon from '$lib/icons/SendIcon.svelte';
import StopIcon from '$lib/icons/StopIcon.svelte';

let keydownHandler: (e: KeyboardEvent) => void;

$: if ($promptSendMode === 'enter') {
    keydownHandler = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(); 
        }
    }
} else {
    keydownHandler = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            sendMessage(); 
        }
    }
}

setTimeout(() => {
    textArea.selectEnd();
}, 10);

let textArea: TextArea;
</script>

<div class="prompt-container">
    <form class="prompt-form">
        <div class="prompt">
            <TextArea
                bind:this={textArea}
                value={$prompt}
                maxHeight={200}
                placeholder="Send a message..."
                on:customchange={(e) => $prompt = e.detail}
                on:keydown={keydownHandler}
                style="max-height: 200px; height: 52px; padding: .875rem 3rem .875rem 1rem;"
            />
            {#if $generating}
                <div class="stop-button-container">
                    <div class="stop-button-wrapper">
                        <div class="stop-button-inner-wrapper">
                            <button
                                class="stop-button"
                                on:click={stopGenerating}
                            >
                                <StopIcon/>
                            </button>
                        </div>
                    </div>
                </div>
            {:else}
                <button
                    class="send-button"
                    disabled={$prompt === ''}
                    on:click={() => {
                        if ($prompt.trim() !== '') {
                            sendMessage();
                        }
                    }}
                >
                    <SendIcon/>
                </button>
            {/if}
        </div>
    </form>
    <div class="footer"></div>
</div>

<style lang="scss">

.prompt-container {
    width: 100%;

    .prompt-form {
        max-width: 48rem;
        margin-left: auto;
        margin-right: auto;
        display: flex;
        flex-direction: row;


        .prompt {
            width: 100%;
            border-radius: 1rem;
            border: 1px solid rgba(0,0,0,.2);
            position: relative;
            display: flex;
            flex-direction: column;

            &:focus-within {
                box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 2px 6px 0px;
                border-color: rgba(0,0,0,.25);
            }

            .send-button {
                position: absolute;
                padding: .125rem;
                border-radius: 0.5rem;
                right: .75rem;
                bottom: .75rem;
                background-color: black;
                border: 1px solid black;
                color: white;
                cursor: pointer;

                transition: opacity .15s cubic-bezier(.4,0,.2,1);

                &:disabled {
                    opacity: 0.1;
                    cursor: default;
                }
            }

            .stop-button-container {
                position: absolute;
                padding: .5rem;
                right: .5rem;
                top: 0;
                bottom: 0;

                .stop-button-wrapper {
                    display: flex;
                    height: 100%;

                    .stop-button-inner-wrapper {
                        display: flex;
                        flex-direction: row;
                        justify-content: center;
                        align-items: center;
                        gap: .75rem;
                        height: 100%;

                        .stop-button {
                            cursor: pointer;
                            padding: .25rem;
                            background-color: transparent;
                            border: 2px solid rgb(15, 15, 15);
                            border-radius: 9999px;
                        }
                    }
                }
            }
        }
    }

    .footer {
        height: 32px;
        width: 100%;
    }
}
</style>
