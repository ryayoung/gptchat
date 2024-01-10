<script lang="ts">
import CodiconClose from './icon/CodiconClose.svelte'
let { type, text, onremove } = $props<{
    type: string
    text: string
    onremove: () => void
}>()
</script>

<div class="background">
    <div class="error flex items-start">
        <button onclick={onremove}>
            <CodiconClose />
        </button>
        <div class="content flex-col gap.25">
            <div class="header">{type} Error</div>
            <div class="text selectable-text">{text}</div>
        </div>
    </div>
</div>

<style lang="scss">
@import '../styles/pre.scss';

.background {
    background-color: color($surface-primary);
    border-radius: 0.5rem;
}

.error {
    background-color: color($black, 0.1);
    padding: 0.25rem 0.5rem 0.5rem 0.5rem;
    border-radius: 0.5rem;

    box-shadow: 0 2px 6px color($black, 0.1);

    button {
        padding-right: 0.5rem;
        height: 1.1rem;
    }

    .content {
        .header {
            font-weight: bold;
            opacity: 0.3;
        }
        .text {
            font-family: monospace;
        }
    }
}
</style>
