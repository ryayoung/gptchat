<script lang="ts">
import type { FunctionResultType } from '$lib/core';
import CheckIcon from './icon/Check.svelte';
import BangIcon from './icon/Bang.svelte';
import ChevronIcon from './icon/Chevron.svelte';
import CodiconLoading from './icon/CodiconLoading.svelte';
export let progressMode: string;
export let title: string;
export let args: string;
export let result: string | null;
export let generating: boolean;
export let resultType: FunctionResultType;
export let markdownRenderer: (markdown: string) => string;

let open: boolean = generating ? true : true;
</script>

<div class="tab  flex items-center gap.625">
    <div class="indicator-container  relative">
        <div class="indicator {progressMode}  flex-center full rounded">
            {#if progressMode === 'error'}
                <BangIcon/>
            {:else if progressMode === 'progress'}
                <CodiconLoading style="height: 1.25rem; width: 1.25rem;"/>
            {:else}
                <CheckIcon/>
            {/if}
        </div>
    </div>
    <div class="label-container  relative w-full">
        <button class="label  flex items-center gap.25" on:click={() => open = !open}>
            <div class="markdown-body function-status selectable-text-deep">
                {@html title}
            </div>
            <ChevronIcon {open}/>
        </button>
    </div>
</div>
{#if open}
    <div class="content  overflow-hidden">
        {#if args}
            <div class="header  text-xs">Arguments</div>
            <div class="markdown-body arguments selectable-text-deep">
                {@html args}
            </div>
        {/if}
        {#if result}
            <div class="footer">
                <div class="title  text-xs">Result</div>
                {#if resultType === 'text'}
                    <pre class="result selectable-text">{result}</pre>
                {:else if resultType === 'markdown'}
                    <div class="markdown-body selectable-text-deep">
                        {@html markdownRenderer(result)}
                    </div>
                {/if}
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
