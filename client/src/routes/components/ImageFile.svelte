<script lang="ts">
import { createEventDispatcher } from 'svelte';
import CodiconClose from './icon/CodiconClose.svelte';
const dispatch = createEventDispatcher();
export let image_url: string;
export let removable: boolean;
</script>

<div class="image-item  relative overflow-hidden set-visibility-on-hover">
    <span class="image  flex-center full" style="background-image: url({image_url});"/>
    {#if removable}
        <button class="remove  rounded" on:click={() => dispatch('remove')}>
            <CodiconClose/>
        </button>
    {/if}
</div>

<style lang="scss">
@import '../../styles/pre.scss';

.image-item {
    border-radius: .75rem;
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
    @include absolute($top: .125rem, $right: .125rem);
    padding: .125rem;
    background-color: black;
    border: .5px solid white;
    color: white;
    visibility: var(--visibility);
}

</style>
