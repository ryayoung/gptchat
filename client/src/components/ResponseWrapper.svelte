<script lang="ts">
let { type, agentName, children } = $props<{
    type: 'user' | 'agent'
    agentName: string
    children: any
}>()
</script>

<div class="chat-container w-full">
    <div class="chat flex gap.75 mx-auto">
        <div class="avatar {type}  flex-center rounded overflow-hidden" />
        <div class="message-container flex-col">
            <div class="name">{type === 'user' ? 'You' : agentName}</div>
            <div class="sections-container">
                {@render children()}
            </div>
        </div>
        <div class="right-spacer" />
    </div>
</div>

<style lang="scss">
@import '../styles/pre.scss';

.chat-container {
    padding: 0 1rem;
}

.chat {
    padding: 0.5rem 1.25rem;
    max-width: 48rem;

    --button-visibility: hidden;

    &:hover {
        --button-visibility: visible;
    }
}

.avatar {
    flex-shrink: 0;
    @include square(1.5rem);
    margin-top: 0.125rem;

    &.user {
        background-color: color($gray-400);
    }
    &.agent {
        background-color: color($accent);
    }
}

.message-container {
    flex-grow: 1;
    overflow: hidden;
    .name {
        font-weight: 600;
    }
}

.right-spacer {
    flex-shrink: 0;
    width: 1.5rem;
}
</style>
