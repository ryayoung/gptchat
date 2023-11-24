<script lang="ts">
import { 
    plan,
    scrollIntoViewDiv,
    scrollContainerDiv,
    scrollChatToBottom,
    serverError,
} from '$lib/main';
import Prompt from '$lib/chat/Prompt.svelte';
import UserResponse from '$lib/chat/UserResponse.svelte';
import AssistantResponse from '$lib/chat/AssistantResponse.svelte';

</script>

<div class="container">
    <div class="chats-container">
        <div class="scroll-to-bottom-container">
            <div class="scroll-to-bottom" bind:this={$scrollContainerDiv}>
                <div class="chats">
                    <div class="header">
                    </div>
                    {#each $plan as msgPlan, planIndex}
                        <div class="chat-container">
                            <div class="chat-wrapper">
                                <div class="chat">
                                    <div class="avatar-container">
                                        <div>
                                            <div style="padding-top: .125rem;">
                                                <div class="avatar" style="background-color: {msgPlan.type === 'user' ? 'var(--color-border-default)' : 'var(--color-accent-fg)'}">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="message-container">
                                        <div class="name">{msgPlan.type === 'user' ? 'You' : 'Assistant'}</div>
                                        <div class="sections-container">
                                            {#if msgPlan.type === 'user'}
                                                <UserResponse id={msgPlan.id}/>
                                            {:else}
                                                <AssistantResponse
                                                    parts={msgPlan.parts}
                                                    planIndex={planIndex}
                                                />
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                    <div
                        bind:this={$scrollIntoViewDiv}
                        style="width: 100%; height: 1px; opacity: 0;"
                    ></div>
                </div>
            </div>
        </div>
    </div>
    <Prompt/>
    {#if $serverError}
        <div class="server-error-container">
            <button on:click={() => $serverError = null}>
                <div class="codicon codicon-close"></div>
            </button>
            <div class="content">
                <div class="header">Server Error</div>
                <div class="text selectable-text">{$serverError}</div>
            </div>
        </div>
    {/if}
</div>


<style lang="scss">
.container {
    width: 100vw;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: var(--color-canvas-default);
}

.chats-container {
    flex: 1 1 0%;
    overflow: hidden;
}

.scroll-to-bottom-container {
    position: relative;
    height: 100%;
}

.scroll-to-bottom {
    height: 100%;
    overflow-y: scroll;
    width: 100%;
}

.chats {
    padding-bottom: 2.25rem;
    font-size: .875rem;
    line-height: 1.25rem;
    display: flex;
    flex-direction: column;

    .header {
        font-weight: 600;
        padding: .5rem;
        background-color: hsla(0,0%,100%,.95);
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 3.5rem;
        margin-bottom: .375rem;
        z-index: 10;
        top: 0;
        position: sticky;
    }

    .chat-container {
        width: 100%;    

        .chat-wrapper {
            padding: .5rem 1rem;
            margin: auto;

            .chat {
                padding: 0 1.25rem;
                max-width: 48rem;
                font-size: 1rem;
                line-height: 1.5rem;
                display: flex;
                gap: .75rem;
                margin-left: auto;
                margin-right: auto;

                --button-visibility: hidden;

                &:hover {
                    --button-visibility: visible;
                }

                .avatar-container {
                    position: relative;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;

                    .avatar {
                        position: relative;
                        border-radius: 9999px;
                        overflow: hidden;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 1.5rem;
                        height: 1.5rem;
                    }
                }

                .message-container {
                    width: 100%;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    
                    .name {
                        font-weight: 600;
                    }
                }
            }
        }
    }
}

.server-error-container {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background-color: palegoldenrod;
    padding: .25rem .5rem .5rem .5rem;
    border-radius: .5rem;

    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    max-width: 40%;
    box-shadow: rgba(0, 0, 0, 0.05) 0px 2px 6px 4px;

    button {
        cursor: pointer;
        background: none;
        border: none;
        padding-right: .5rem;
        height: 1.1rem;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: .25rem;

        .header {
            font-weight: bold;
            color: rgba(0,0,0,.3);
        }
        .text {
            background: none;
            opacity: 1;
            font-family: monospace;
        }
    }


}
</style>


