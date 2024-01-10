<script lang="ts">
import CodiconClose from './icon/CodiconClose.svelte'

let { image_url, onremove = null } = $props<{
    image_url: string
    onremove?: () => void | null
}>()
</script>

<div class="image-item relative overflow-hidden set-visibility-on-hover">
    <span class="image flex-center full" style="background-image: url({image_url});" />
    {#if onremove !== null}
        <button class="remove rounded" onclick={onremove}>
            <CodiconClose />
        </button>
    {/if}
</div>

<style lang="scss">
@import '../styles/pre.scss';

.image-item {
    border-radius: 0.75rem;
    border-width: 1px;
    border-color: color($gray-650);
    height: 4.5rem;
    width: 4.5rem;
}
.image {
    background-position: 50%;
    background-size: cover;
}

button.remove {
    @include absolute($top: 0.125rem, $right: 0.125rem);
    padding: 0.125rem;
    background-color: black;
    border: 0.5px solid white;
    color: white;
    visibility: var(--visibility);
}
</style>
