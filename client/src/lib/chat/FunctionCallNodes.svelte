<script lang="ts">
import { 
    functionDisplayConfig,
    generating,
    type FunctionCallProgressMode,
} from '$lib/main';
import {
    toMarkdown,
    isPythonErrorString,
} from '$lib/utils';
import CheckIcon from '$lib/icons/CheckIcon.svelte';
import BangIcon from '$lib/icons/BangIcon.svelte';
import ChevronIcon from '$lib/icons/ChevronIcon.svelte';

type FunctionCall = {
    name: string;
    arguments: string | null;
}
export let inProgress: boolean;
export let functionCall: FunctionCall;
export let result: string | null;

let progressMode: FunctionCallProgressMode;
$: progressMode = result && isPythonErrorString(result) ? 'error'
    : inProgress ? 'progress'
    : 'complete';

$: functionName = functionCall.name;
$: formattedArgs = getFormattedArgs(functionCall.arguments);
$: formattedResult = getFormattedResult(result);

$: defaultDisplay = toMarkdown(`Function call to **\`${functionName}()\`**`)

let displayText: string;

$: if (functionName in $functionDisplayConfig) {
    const config: string | undefined = $functionDisplayConfig[functionName][progressMode];
    displayText = config ? toMarkdown(config.replace("\n\n", " ")) : defaultDisplay;
} else {
    displayText = defaultDisplay;
}


function getFormattedArgs(args: string | null | undefined): string | null {
    if (!args) return null;
    let content: string;
    try {
        content = JSON.stringify(JSON.parse(args), null, 2);
    } catch (e) {
        content = args;
    }
    return toMarkdown("```json\n" + content + "\n```");
}

function getFormattedResult(result: string | null | undefined): string | null {
    if (!result) return null;
    return toMarkdown("```\n" + result + "\n```");
}

let open: boolean = $generating ? true : false;
</script>

<div class="action-tab">
    <div class="indicator-container">
        <div class="indicator {progressMode}">
            {#if progressMode === 'error'}
                <BangIcon/>
            {:else if progressMode === 'progress'}
                <div class="codicon codicon-loading"></div>
            {:else}
                <CheckIcon/>
            {/if}
        </div>
    </div>
    <div class="action-tab-content">
        <button class="action" on:click={() => open = !open}>
            <div class="markdown-body function-status selectable-text-deep">
                {@html displayText}
            </div>
            <ChevronIcon {open}/>
        </button>
    </div>
</div>
{#if open}
    <div class="action-content">
        {#if formattedArgs}
            <div class="header">Arguments</div>
            <div class="markdown-body arguments selectable-text-deep">
                {@html formattedArgs}
            </div>
        {/if}
        {#if formattedResult}
            <div class="footer">
                <div class="title">Result</div>
                <div class="markdown-body transparent-code-block selectable-text-deep">
                    {@html formattedResult}
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
.action-tab {
    margin-bottom: .625rem;
    margin-top: .625rem;
    display: flex;
    align-items: center;
    gap: .625rem;

    .indicator-container {
        position: relative;
        flex-shrink: 0;
        width: 1.25rem;
        height: 1.25rem;

        .indicator {
            position: absolute;
            left: 0;
            top: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;

            &.complete {
                color: var(--color-canvas-default);
                background-color: var(--color-accent-fg);
                border-radius: 9999px;
            }
            &.error {
                color: var(--color-canvas-default);
                background-color: var(--color-danger-fg);
                border-radius: 9999px;
            }
            &.progress {

                .codicon.codicon-loading {
                    height: 12px;
                    line-height: 1.25rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.25rem;
                    animation: rotate-circle 2s linear infinite;
                }
            }
        }
    }

    .action-tab-content {
        position: relative;
        margin-top: -.75px;
        //height: 1.25rem;
        width: 100%;
        line-height: 1.25rem;

        button.action {
            cursor: pointer;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: .25rem;
            color: inherit;
            font-family: inherit;
            font-size: 100%;
            font-weight: inherit;
            line-height: inherit;
            margin: 0;
            padding: 0;
            background-color: transparent;
            border-width: 0;

            .markdown-body.function-status {
                color: var(--color-fg-muted);
                line-height: 1.25rem;
                text-align: left;

                :global(p) {
                    margin-bottom: .25rem;
                }
            }
        }
    }
}

.action-content {
    overflow: hidden;
    margin-top: .125rem;
    margin-bottom: .75rem;
    border-radius: .75rem;
    border: 1px solid var(--color-border-default);

    .header {
        font-size: .75rem;
        line-height: 1rem;
        padding: .5rem 1rem;
        //background-color: rgba(34, 39, 46, 0.9);
        //color: rgb(217, 217, 227);
    }

    .markdown-body.arguments {
        border-radius: 0;
        border-top: 1px solid var(--color-border-default);
        border-bottom: 1px solid var(--color-border-default);
    }

    .footer {
        padding: 1rem;
        //background-color: rgba(34, 39, 46, 0.9);
        //color: rgb(217, 217, 227);
        //border: 1px solid var(--color-border-default);

        .title {
            font-size: .75rem;
            line-height: 1rem;
            margin-bottom: .25rem;
        }
    }
}
</style>
