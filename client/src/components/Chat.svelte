<script lang="ts">
import type { Chat, RenderedMessage } from '../lib/core/index.svelte'
import Prompt from './Prompt.svelte'
import UserResponse from './UserResponse.svelte'
import AgentResponse from './AgentResponse.svelte'
import AgentToolCallPart from './AgentToolCallPart.svelte'
import ResponseWrapper from './ResponseWrapper.svelte'
import ErrorMessage from './ErrorMessage.svelte'
import BinaryFile from './BinaryFile.svelte'
import ImageFile from './ImageFile.svelte'
import PencilNewIcon from './icon/PencilNew.svelte'
import CodiconLoading from './icon/CodiconLoading.svelte'

let { chat, totalWidth, totalHeight } = $props<{
    chat: Chat
    totalWidth: number
    totalHeight: number
}>()

const { msgMapping, prompt, errors, rendered, config } = chat

let agentName: string = $derived($config.agent_name ?? 'Assistant')

$effect.pre(() => {
    rendered.set(chat.renderMessages($msgMapping, $config.functions, chat.generating))
})
</script>

<div class="container flex-col">
    <div
        class="chats flex-col relative full scroll-y"
        use:chat.scroll.action
    >
        <div class="header flex justify-between items-center">
            <div class="flex items-center gap.5">
                <button class="new btn btn-neutral" onclick={() => chat.reset()}>
                    <PencilNewIcon />
                </button>
            </div>
            {#if !chat.connected}
                <CodiconLoading style="width: 1.5rem; height: 1.5rem;" />
            {/if}
        </div>
        {#each $rendered as response, index}
            <ResponseWrapper type={response.type} {agentName}>
                {#if response.type === 'user'}
                    <UserResponse
                        contentText={response.contentText}
                        contentImages={response.contentImages}
                        contentBinaries={response.contentBinaries}
                        generating={chat.generating}
                        onsubmit={response.onsubmit}
                    />
                {:else}
                    <AgentResponse regenerate={() => chat.regenerateOnAgentResponse(index)}>
                        {#each response.parts as part}
                            {#if part.type === 'content'}
                                <div class="markdown-body selectable-text-deep">
                                    {@html part.markdownContent}
                                </div>
                            {:else}
                                <AgentToolCallPart
                                    progressMode={part.progressMode}
                                    header={part.header}
                                    args={part.args}
                                    argsTitle={part.argsTitle}
                                    result={part.result}
                                    resultTitle={part.resultTitle}
                                    resultType={part.resultType}
                                    generating={chat.generating}
                                />
                            {/if}
                        {/each}
                    </AgentResponse>
                {/if}
            </ResponseWrapper>
        {/each}
    </div>
    <Prompt
        text={prompt.text}
        generating={chat.generating}
        onchange={(text) => (prompt.text = text)}
        onupload={() => chat.upload()}
        onsubmit={() => chat.sendMessage()}
        onstop={() => chat.stopGenerating()}
    >
        {#if prompt.images.length > 0}
            <div class="file-uploads flex flex-wrap gap.5 text-sm">
                {#key prompt.images.length}
                    {#each prompt.images as image, index}
                        <ImageFile image_url={image.image_url.url} onremove={() => chat.prompt.removeImage(index)} />
                    {/each}
                {/key}
            </div>
        {/if}
        {#if prompt.files.length > 0}
            <div class="file-uploads flex flex-wrap gap.5 text-sm">
                {#key prompt.files.length}
                    {#each prompt.files as file, index}
                        <BinaryFile name={file.name} onremove={() => chat.prompt.removeFile(index)} />
                    {/each}
                {/key}
            </div>
        {/if}
    </Prompt>
    {#if errors.items.length > 0}
        <div class="errors-container flex-col gap.5">
            {#each errors.items as { type, text } (text)}
                {#if errors.showType(type)}
                    <ErrorMessage {type} {text} onremove={() => errors.remove(text)} />
                {/if}
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
@import '../styles/pre.scss';

.container {
    width: 100vw;
    height: 100vh;
}

button.new {
    padding: 0.5rem;
    margin-left: 0.5rem;
    color: color($bw-inverse);
}

.chats {
    padding-bottom: 2.25rem;

    .header {
        flex-shrink: 0;
        @include sticky(10, $top: 0);
        font-weight: 600;
        padding: 0.5rem;
        background-color: color($surface-primary);
        height: 3.5rem;
        margin-bottom: 0.375rem;
    }
}

.file-uploads {
    padding: 0.5rem 0.5rem 0 0.5rem;
}

.errors-container {
    @include absolute(1.25rem, 1.25rem);
    z-index: 1000;
    max-width: 40%;
}
</style>
