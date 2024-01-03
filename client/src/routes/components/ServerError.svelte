<script lang="ts">
import { createEventDispatcher } from 'svelte';
import CodiconClose from './icon/CodiconClose.svelte';
const dispatch = createEventDispatcher();
export let type: string;
export let text: string;
</script>

<div class="background">
    <div class="server-error flex items-start">
        <button on:click={() => dispatch('remove')}>
            <CodiconClose/>
        </button>
        <div class="content flex-col gap.25">
            <div class="header">{type} Error</div>
            <div class="text selectable-text">{text}</div>
        </div>
    </div>
</div>

<style lang="scss">
@import '../../styles/pre.scss';

.background {
    background-color: color($surface-primary);
    border-radius: .5rem;
}

.server-error {
    background-color: color($black, .1);
    padding: .25rem .5rem .5rem .5rem;
    border-radius: .5rem;

    box-shadow: 0 2px 6px color($black, .1);

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
