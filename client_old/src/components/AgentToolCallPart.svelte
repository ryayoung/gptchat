<script lang="ts">
import type { FunctionResultType } from '../lib/core';
import CheckIcon from './icon/Check.svelte';
import BangIcon from './icon/Bang.svelte';
import ChevronIcon from './icon/Chevron.svelte';
import CodiconLoading from './icon/CodiconLoading.svelte';
export let progressMode: string;
export let header: string | null;
export let args: string;
export let argsTitle: string;
export let result: string | null;
export let resultTitle: string;
export let resultType: FunctionResultType;
export let generating: boolean;

let open: boolean = generating ? true : true;
</script>

{#if header !== null}
    <div class="header  flex items-center gap.625">
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
                    {@html header}
                </div>
                <ChevronIcon {open}/>
            </button>
        </div>
    </div>
{/if}
{#if open || header === null}
    <div class="content  overflow-hidden">
        {#if args}
            <div class="title args  text-xs">{@html argsTitle}</div>
            <div class="horizontal-divider"></div>
            <div class="markdown-body selectable-text-deep">
                {@html args}
            </div>
        {/if}
        {#if result !== null}
            <div class="horizontal-divider"></div>
            {#if resultType === 'text'}
                <div class="text-result-wrapper">
                    <div class="title text-result  text-xs">{@html resultTitle}</div>
                    <pre class="result selectable-text">{result}</pre>
                </div>
            {:else}
                <div class="title block-result  text-xs">{@html resultTitle}</div>
                <div class="horizontal-divider"></div>
                {#if resultType === 'html'}
                    <div class="html-result">
                        {@html result}
                    </div>
                {:else}
                    <div class="markdown-body markdown-result selectable-text-deep">
                        {@html result}
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
{/if}

<style lang="scss">
@import '../styles/pre.scss';

:global(pre.markdown-code-block.plain) {
    border-radius: 0;
}

.header {
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
    margin: .75rem 0 .75rem 0;
    border-radius: .75rem;
    border: 1px solid color($border, .2);
}

.title {
    &.args, &.block-result {
        padding: .5rem 1rem;
    }

    &.block-result {
        background-color: color($black, 0.08);
    }

    &.text-result {
        margin-bottom: .5rem;
    }

}

.horizontal-divider {
    border-top: 1px solid color($border, .2);
}

.text-result-wrapper {
    padding: .75rem 1rem 1rem 1rem;
    overflow: auto;
}

.markdown-body.markdown-result {
    max-height: 25rem;
    overflow: auto;
}

.html-result {
    overflow: auto;
}
</style>
