<script lang="ts">
import { toMarkdown } from '$lib/utils';
import {
    messages,
    generating,
    plan,
    regenerateOnAssistantResponse,
    type PlanPart,
    type PlanMessage,
    type Message,
    type FunctionCall,
} from '$lib/main';
import RefreshIcon from '$lib/icons/RefreshIcon.svelte';
import FunctionCallNodes from '$lib/chat/FunctionCallNodes.svelte';

export let parts: PlanPart[];
export let planIndex: number;


function functionCallIsInProgress(generating: boolean, planLength: number, planIndex: number, partIndex: number, partResultId: string | null): boolean {
    if (!generating) return false;
    if (partResultId) return false;
    if (planIndex < planLength - 1) return false;

    const planMessage: PlanMessage = $plan[planIndex];
    if (planMessage.type !== 'assistant') throw new Error("Non-assistant message in plan. Unreachable.");

    const remainingParts = planMessage.parts.slice(partIndex + 1);

    for (const { type } of remainingParts) {
        if (type === 'content') return false;
    }
    return true;
}

function forceGetFunctionCall(messages: RecordOf<Message>, callId: string): FunctionCall {
    const message = messages[callId];
    if (message.role !== 'assistant' || !message.function_call) {
        throw new Error("Message is not a function call. Should be unreachable.");
    }
    return message.function_call;
}

</script>

<div class="sections-container">
    <div class="content-container">
        {#each parts as part, partIndex}
            {#if part.type === 'content' && part.id in $messages}
                <div class="markdown-body selectable-text-deep">
                    {@html toMarkdown($messages[part.id]?.content ?? '')}
                </div>
            {:else if part.type === 'function' && part.callId in $messages}
                <FunctionCallNodes
                    inProgress={functionCallIsInProgress($generating, $plan.length, planIndex, partIndex, part.resultId)}
                    functionCall={forceGetFunctionCall($messages, part.callId)}
                    result={part.resultId ? $messages[part.resultId]?.content ?? null : null}
                />
            {/if}
        {/each}
    </div>
    <div class="controls">
        <div class="buttons-container">
            <button
                on:click={() => regenerateOnAssistantResponse(planIndex)}
            >
                <div class="icon-wrapper">
                    <RefreshIcon/>
                </div>
            </button>
        </div>
    </div>
</div>

<style lang="scss">

.content-container {
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
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
