<script lang="ts">
import type { Chat } from '../lib/core/index.svelte';
import Prompt from './Prompt.svelte';
import UserResponse from './UserResponse.svelte';
import AgentResponse from './AgentResponse.svelte';
import AgentToolCallPart from './AgentToolCallPart.svelte';
import ResponseWrapper from './ResponseWrapper.svelte';
import ErrorMessage from './ErrorMessage.svelte';
import BinaryFile from './BinaryFile.svelte';
import ImageFile from './ImageFile.svelte';
import PencilNewIcon from './icon/PencilNew.svelte';
import CodiconLoading from './icon/CodiconLoading.svelte';

let { chat } = $props<{
    chat: Chat,
}>();

const { prompt, scroll, errors, rendered, config } = chat;

let agentName: string = $derived($config.agent_name ?? 'Assistant');

setTimeout(() => scroll.scroll('force'))
</script>


<div class="container  flex-col">
    {#snippet userResponse({ id, content, generating })}
        <UserResponse
            contentText={chat.userContentToText(content)}
            contentFiles={chat.userContentToFiles(content)}
            {generating}
            onsubmit={text => chat.changeUserMessageAndSubmit(id, text)}
        />
    {/snippet}
    <div class="chats  flex-col relative full scroll-y" bind:this={scroll.containerDiv} onscroll={scroll.handleUserScrollDebounced}>
        <div class="header  flex justify-between items-center">
            <div class="flex items-center gap.5">
                <button class="new  btn btn-neutral" onclick={() => chat.reset()}>
                    <PencilNewIcon/>
                </button>
            </div>
            {#if !chat.connected}
                <CodiconLoading style="width: 1.5rem; height: 1.5rem;"/>
            {/if}
        </div>
        {#each $rendered as response, idx}
            <ResponseWrapper type={response.type} {agentName}>
                {#if response.type === 'user'}
                    {@render userResponse(response)}
                {:else}
                    <AgentResponse regenerate={() => chat.regenerateOnAgentResponse(idx)}>
                        {#each response.parts as part}
                            {#if part.type === 'content'}
                                <div class="markdown-body selectable-text-deep">
                                    {@html chat.renderAssistantMarkdown(part.content)}
                                </div>
                            {:else}
                                <AgentToolCallPart
                                    progressMode={chat.getFunctionCallStatus(part.result, chat.generating)}
                                    header={chat.renderFunctionHeader(part.name, $config.functions)}
                                    args={chat.renderFunctionCallArgs(part.arguments, part.name, $config.functions)}
                                    argsTitle={chat.getArgsTitle(part.name, $config.functions)}
                                    result={chat.renderFunctionResult(part.result, part.name, $config.functions)}
                                    resultTitle={chat.getResultTitle(part.name, $config.functions)}
                                    resultType={chat.getFunctionResultType(part.name, $config.functions)}
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
        onchange={text => prompt.text = text}
        onupload={() => chat.upload()}
        onsubmit={() => chat.sendMessage()}
        onstop={() => chat.stopGenerating()}
    >
        {#if prompt.images.length > 0}
            <div class="file-uploads flex flex-wrap gap.5 text-sm">
                {#key prompt.images.length}
                    {#each prompt.images as image, index}
                        <ImageFile
                            image_url={image.image_url.url}
                            onremove={() => chat.prompt.removeImage(index)}
                        />
                    {/each}
                {/key}
            </div>
        {/if}
        {#if prompt.files.length > 0}
            <div class="file-uploads flex flex-wrap gap.5 text-sm">
                {#key prompt.files.length}
                    {#each prompt.files as file, index}
                        <BinaryFile
                            name={file.name}
                            onremove={() => chat.prompt.removeFile(index)}
                        />
                    {/each}
                {/key}
            </div>
        {/if}
    </Prompt>
    {#if errors.items.length > 0}
        <div class="errors-container  flex-col gap.5">
            {#each errors.items as { type, text } (text)}
                {#if errors.showType(type)}
                    <ErrorMessage {type} {text} onremove={() => errors.remove(text)}/>
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
    padding: .5rem;
    margin-left: .5rem;
    color: color($bw-inverse);
}

.chats {
    padding-bottom: 2.25rem;

    .header {
        flex-shrink: 0;
        @include sticky(10, $top: 0);
        font-weight: 600;
        padding: .5rem;
        background-color: color($surface-primary);
        height: 3.5rem;
        margin-bottom: .375rem;
    }
}

.file-uploads {
    padding: .5rem .5rem 0 .5rem;
}

.errors-container {
    @include absolute(1.25rem, 1.25rem);
    z-index: 1000;
    max-width: 40%;
}
</style>
