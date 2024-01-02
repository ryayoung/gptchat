<script lang="ts">
import { createEventDispatcher } from 'svelte';
import RefreshIcon from './icon/Refresh.svelte';
const dispatch = createEventDispatcher();

</script>

<div class="sections-container">
    <div class="content-container  flex-col">
        <slot/>
    </div>
    <div class="controls  flex gap.25">
        <div class="buttons-container">
            <button on:click={() => dispatch('regenerate')}>
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
