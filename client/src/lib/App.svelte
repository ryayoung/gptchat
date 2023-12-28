<script lang="ts">
import { 
    plan,
    scrollIntoViewDiv,
    autoScrollEnabled,
    scrollContainerDiv,
    serverError,
} from '$lib/main';
import { debounce } from '$lib/utils';
import Prompt from '$lib/chat/Prompt.svelte';
import UserResponse from '$lib/chat/UserResponse.svelte';
import AssistantResponse from '$lib/chat/AssistantResponse.svelte';

let lastScrollTop: number = 0;

function handleScroll() {
    if (!$scrollContainerDiv) return;
    const { scrollHeight, scrollTop, clientHeight } = $scrollContainerDiv;
    if (scrollTop < lastScrollTop) {
        $autoScrollEnabled = false;
    } else if (scrollHeight - scrollTop <= clientHeight + 50) {
        $autoScrollEnabled = true;
    }
    lastScrollTop = scrollTop;
}

const handleScrollDebounced = debounce(handleScroll, 100);
</script>

<div class="container  flex-col">
    <div class="chats  flex-col relative full scroll-y" bind:this={$scrollContainerDiv} on:scroll={handleScrollDebounced}>
        <div class="header  flex justify-between items-center"/>
        {#each $plan as msgPlan, planIndex}
            <div class="chat-container  w-full">
                <div class="chat  flex gap.75 mx-auto">
                    <div class="avatar {msgPlan.type}  flex-center rounded overflow-hidden"/>
                    <div class="message-container  flex-col relative w-full">
                        <div class="name">{msgPlan.type === 'user' ? 'You' : 'Assistant'}</div>
                        <div class="sections-container">
                            {#if msgPlan.type === 'user'}
                                <UserResponse id={msgPlan.id}/>
                            {:else}
                                <AssistantResponse parts={msgPlan.parts} planIndex={planIndex}/>
                            {/if}
                        </div>
                    </div>
                    <div class="right-spacer"/>
                </div>
            </div>
        {/each}
        <div bind:this={$scrollIntoViewDiv} style="width: 100%; height: 0px; visibility: hidden;"/>
    </div>
    <Prompt/>
    {#if $serverError}
        <div class="server-error-container  flex items-start">
            <button on:click={() => $serverError = null}> <div class="codicon codicon-close"/> </button>
            <div class="content  flex-col gap.25">
                <div class="header">Server Error</div>
                <div class="text selectable-text">{$serverError}</div>
            </div>
        </div>
    {/if}
</div>


<style lang="scss">

@import '../styles/pre.scss';

.container {
    width: 100vw;
    height: 100vh;
}

.chats {
    padding-bottom: 2.25rem;

    .header {
        flex-shrink: 0;
        @include sticky(10, $top: 0);
        font-weight: 600;
        padding: .5rem;
        background-color: color($surface-primary, .95);
        height: 3.5rem;
        margin-bottom: .375rem;
    }
}


.chat-container {
    padding: 0 1rem;
}

.chat {
    padding: .5rem 1.25rem;
    max-width: 48rem;

    --button-visibility: hidden;

    &:hover {
        --button-visibility: visible;
    }
}

.avatar {
    flex-shrink: 0;
    @include square(1.5rem);
    margin-top: .125rem;

    &.user {
        background-color: color($gray-400);
    }
    &.assistant {
        background-color: color($accent);
    }
}
.right-spacer {
    flex-shrink: 0;
    width: 1.5rem;
}

.message-container {
    .name {
        font-weight: 600;
    }
}

.server-error-container {
    @include absolute(1.25rem, 1.25rem);
    z-index: 1000;
    background-color: palegoldenrod;
    padding: .25rem .5rem .5rem .5rem;
    border-radius: .5rem;

    max-width: 40%;
    box-shadow: 0 2px 6px color($black, .1);
    color: black;

    button {
        padding-right: .5rem;
        height: 1.1rem;
    }

    .content {

        .header {
            font-weight: bold;
            opacity: .3;
        }
        .text {
            font-family: monospace;
        }
    }
}
</style>


