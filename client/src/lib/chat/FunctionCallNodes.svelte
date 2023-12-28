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
import CheckIcon from '$lib/icons/Check.svelte';
import BangIcon from '$lib/icons/Bang.svelte';
import ChevronIcon from '$lib/icons/Chevron.svelte';

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

let open: boolean = $generating ? true : true;
</script>

<div class="tab  flex items-center gap.625">
    <div class="indicator-container  relative">
        <div class="indicator {progressMode}  flex-center full rounded">
            {#if progressMode === 'error'}
                <BangIcon/>
            {:else if progressMode === 'progress'}
                <div class="codicon codicon-loading"></div>
            {:else}
                <CheckIcon/>
            {/if}
        </div>
    </div>
    <div class="label-container  relative w-full">
        <button class="label  flex items-center gap.25" on:click={() => open = !open}>
            <div class="markdown-body function-status selectable-text-deep">
                {@html displayText}
            </div>
            <ChevronIcon {open}/>
        </button>
    </div>
</div>
{#if open}
    <div class="content  overflow-hidden">
        {#if formattedArgs}
            <div class="header  text-xs">Arguments</div>
            <div class="markdown-body arguments selectable-text-deep">
                {@html formattedArgs}
            </div>
        {/if}
        {#if result}
            <div class="footer">
                <div class="title  text-xs">Result</div>
                <pre class="result selectable-text">{result}</pre>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
@import '../../styles/pre.scss';

.tab {
    margin-bottom: .625rem;
    margin-top: .625rem;
}

.indicator-container {
    flex-shrink: 0;
    @include square(1.25rem);
}
.indicator {
    @include absolute($top: 0, $left: 0);
    color: white;

    &.complete {
        background-color: color($accent);
    }
    &.error {
        background-color: color($red);
    }
    &.progress {
        color: color($text-secondary);

        .codicon.codicon-loading {
            height: 12px;
            line-height: 1.25rem;
            font-size: 1.25rem;
            animation: rotate-circle 2s linear infinite;
        }
    }
}

.label-container {
    margin-top: -.75px;
    line-height: 1.25rem;
}
button.label {
    .markdown-body.function-status {
        color: color($text-secondary);
        line-height: 1.25rem;
        text-align: left;

        :global(p) {
            margin-bottom: .25rem;
        }
    }
}

.content {
    margin: .125rem 0 .75rem 0;
    border-radius: .75rem;
    border: 1px solid color($border, .2);
}

.header {
    padding: .5rem 1rem;
}

.markdown-body.arguments {
    border-top: 1px solid color($border, .2);
    border-bottom: 1px solid color($border, .2);
}

.footer {
    padding: 1rem;
    overflow: auto;

    .title {
        margin-bottom: .5rem;
    }
}
</style>
