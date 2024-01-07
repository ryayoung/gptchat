<script lang="ts">
import CodiconClose from './icon/CodiconClose.svelte';
import CodiconFile from './icon/CodiconFile.svelte';
let { name, onremove = null, style = ''} = $props<{
    name: string
    onremove?: () => void | null
    style?: string
}>();
</script>

<div class="file-item  inline-flex items-center gap.5 relative set-visibility-on-hover text-sm" {style}>
    <div class="icon"><CodiconFile/></div>
    <span>{name}</span>
    {#if onremove !== null}
        <button onclick={onremove}>
            <CodiconClose/>
        </button>
    {/if}
</div>

<style lang="scss">
@import '../styles/pre.scss';

.file-item {
    border-radius: .75rem;
    border-width: 1px;
    padding: .5rem;
    min-width: 12rem;

    .icon {
        padding: .375rem;
        border-radius: .375rem;
        background-color: color($accent-darker);
    }
    span {
        font-weight: 500;
        flex: 1;
    }
    button {
        padding: .125rem;
        visibility: var(--visibility);
    }
}
</style>
