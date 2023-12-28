<script lang="ts">
import { toMarkdownWrappedCode } from '$lib/utils';
import {
    messages,
    generating,
    plan,
    regenerateOnAssistantResponse,
    type PlanPart,
    type PlanMessage,
    type Message,
    type FunctionCall,
    type AssistantPlan,
    type AssistantMessage,
} from '$lib/main';
import RefreshIcon from '$lib/icons/Refresh.svelte';
import FunctionCallNodes from '$lib/chat/FunctionCallNodes.svelte';

export let parts: PlanPart[];
export let planIndex: number;


function functionCallIsInProgress(generating: boolean, planIndex: number, partIndex: number, partResultId: string | null): boolean {
    if (!generating || partResultId) {
        return false;
    }
    const planMessage = $plan[planIndex] as AssistantPlan;
    for (const { type } of planMessage.parts.slice(partIndex + 1)) {
        if (type === 'content') return false;
    }
    return true;
}

function forceGetFunctionCall(messages: RecordOf<Message>, callId: string): FunctionCall {
    const message = messages[callId] as AssistantMessage;
    if (!message.function_call) {
        throw new Error("Message is not a function call. Should be unreachable.");
    }
    return message.function_call;
}

</script>

<div class="sections-container">
    <div class="content-container  flex-col">
        {#each parts as part, partIndex}
            {#if part.type === 'content' && part.id in $messages}
                <div class="markdown-body selectable-text-deep">
                    {@html toMarkdownWrappedCode($messages[part.id]?.content ?? '')}
                </div>
            {:else if part.type === 'function' && part.callId in $messages}
                <FunctionCallNodes
                    inProgress={functionCallIsInProgress($generating, planIndex, partIndex, part.resultId)}
                    functionCall={forceGetFunctionCall($messages, part.callId)}
                    result={part.resultId ? $messages[part.resultId]?.content ?? null : null}
                />
            {/if}
        {/each}
    </div>
    <div class="controls  flex gap.25">
        <div class="buttons-container">
            <button on:click={() => regenerateOnAssistantResponse(planIndex)}>
                <div class="icon-wrapper  flex items-center gap.375 text-xs">
                    <RefreshIcon/>
                </div>
            </button>
        </div>
    </div>
</div>

<style lang="scss">
@import '../../styles/pre.scss';

.content-container {
    max-width: 100%;
}

.controls {
    margin-top: .25rem;
    color: color($text-tertiary);

    button {
        padding: .25rem;
        padding-left: 0;
        visibility: var(--button-visibility);

        &:hover {
            color: color($text-primary);
        }
    }
}
</style>
