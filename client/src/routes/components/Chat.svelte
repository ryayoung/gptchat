<script lang="ts">
import type { Chat } from '$lib/core';
import Prompt from './Prompt.svelte';
import UserResponse from './UserResponse.svelte';
import AgentResponse from './AgentResponse.svelte';
import AgentToolCallPart from './AgentToolCallPart.svelte';
import ResponseWrapper from './ResponseWrapper.svelte';
import ServerError from './ServerError.svelte';
import BinaryFile from './BinaryFile.svelte';
import ImageFile from './ImageFile.svelte';
import PencilNewIcon from './icon/PencilNew.svelte';
import CodiconLoading from './icon/CodiconLoading.svelte';

export let chat: Chat;

function handleUserMessageSubmit(e: CustomEvent<{ text: string, id: string }>) {
    chat.changeUserMessageAndSubmit(e.detail.id, e.detail.text);
}

const { text: promptText, files: promptFiles, images: promptImages } = chat.prompt;
const { connected, scroll, errors, rendered, generating, config } = chat;
const { containerDiv, ghostDiv, handleUserScrollDebounced } = scroll;

setTimeout(() => scroll.scroll('force'))
</script>

<div class="container  flex-col">
    <div class="chats  flex-col relative full scroll-y" bind:this={$containerDiv} on:scroll={handleUserScrollDebounced}>
        <div class="header  flex justify-between items-center">
            <div class="flex items-center gap.5">
                <button class="new  btn btn-neutral" on:click={() => chat.reset()}>
                    <PencilNewIcon/>
                </button>
            </div>
            {#if !$connected}
                <CodiconLoading style="width: 1.5rem; height: 1.5rem;"/>
            {/if}
        </div>
        {#each $rendered as response, idx}
            <ResponseWrapper type={response.type}>
                {#if response.type === 'user'}
                    <UserResponse
                        id={response.id}
                        contentText={chat.userContentToText(response.content)}
                        contentFiles={chat.userContentToFiles(response.content)}
                        generating={$generating}
                        on:submit={handleUserMessageSubmit}
                    />
                {:else}
                    <AgentResponse on:regenerate={() => chat.regenerateOnAgentResponse(idx)}>
                        {#each response.parts as part}
                            {#if part.type === 'content'}
                                <div class="markdown-body selectable-text-deep">
                                    {@html chat.renderAssistantMarkdown(part.content)}
                                </div>
                            {:else}
                                <AgentToolCallPart
                                    progressMode={chat.getFunctionCallStatus(part.result, $generating)}
                                    title={chat.renderFunctionTitle(part.name, $config.functions)}
                                    args={chat.renderFunctionCallArgs(part.arguments)}
                                    result={part.result}
                                    generating={$generating}
                                    resultType={chat.getFunctionResultType(part.name, $config.functions)}
                                    markdownRenderer={chat.renderFunctionCallMarkdown}
                                />
                            {/if}
                        {/each}
                    </AgentResponse>
                {/if}
            </ResponseWrapper>
        {/each}
        <div bind:this={$ghostDiv} style="width: 100%; height: 0px; visibility: hidden;"/>
    </div>
    <Prompt
        text={$promptText}
        generating={$generating}
        on:customchange={(e) => promptText.set(e.detail)}
        on:upload={() => chat.upload()}
        on:submit={() => chat.sendMessage()}
        on:stop={() => chat.stopGenerating()}
    >
        {#if $promptImages.length > 0}
            <div class="file-uploads flex flex-wrap gap.5 text-sm">
                {#key $promptImages.length}
                    {#each $promptImages as image, index}
                        <ImageFile
                            image_url={image.image_url.url}
                            removable={true}
                            on:remove={() => chat.prompt.removeImage(index)}
                        />
                    {/each}
                {/key}
            </div>
        {/if}
        {#if $promptFiles.length > 0}
            <div class="file-uploads flex flex-wrap gap.5 text-sm">
                {#key $promptFiles.length}
                    {#each $promptFiles as file, index}
                        <BinaryFile
                            name={file.name}
                            removable={true}
                            on:remove={() => chat.prompt.removeFile(index)}
                        />
                    {/each}
                {/key}
            </div>
        {/if}
    </Prompt>
    {#if $errors.length > 0}
        <div class="errors-container  flex-col gap.5">
            {#each $errors as { type, text } (text)}
                {#if errors.showType(type)}
                    <ServerError {type} {text} on:remove={() => errors.remove(text)}/>
                {/if}
            {/each}
        </div>
    {/if}
</div>


<style lang="scss">

@import '../../styles/pre.scss';

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
