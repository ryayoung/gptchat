import * as util from '$lib/util';
import type { FileContentPart, SerializedPrompt } from './prompt';
import type { ConfigStore, FunctionResultType, SerializedConfigStore } from './config';
import type { GeneratingStore } from './generating';
import type { CustomError, ErrorStore } from './error';
import type { PartialMessageAnyRole, ContentPart, Message, AssistantMessage, ToolMessage, SerializedMessages } from './message';
import type { Delta } from './delta';

import { createConfigStore } from './config';
import { createGeneratingStore } from './generating';
import { createErrorStore } from './error';
import { Socket } from './socket';
import { Messages } from './message';
import { Prompt } from './prompt';
import { AutoScroller } from './scroll';

const SERVER_CHANNELS = [
    'connect',
    'start-generating',
    'stop-generating',
] as const;
export type ServerChannel = (typeof SERVER_CHANNELS)[number];


const CLIENT_CHANNELS = [
    'disconnect',
    'connect',
    'config',
    'default-messages',
    'message-set-all',
    'message-set',
    'message-update',
    'generating-started',
    'generating-done',
    'error',
] as const;
export type ClientChannel = (typeof CLIENT_CHANNELS)[number];

export type SerializedChat = {
    prompt: SerializedPrompt,
    messages: SerializedMessages,
    config: SerializedConfigStore,
    errors: CustomError[],
    generating: boolean,
    defaultMessages: PartialMessageAnyRole[],
}

export type FunctionCallStatus = 'progress' | 'complete' | 'error';

export class Chat {
    public scroll: AutoScroller = new AutoScroller()
    public rendered = util.writable<RenderedMessage[]>([]);
    public connected = util.writable<boolean>(false);

    public prompt: Prompt = new Prompt()
    public messages: Messages = new Messages()
    public config: ConfigStore = createConfigStore();
    public errors: ErrorStore = createErrorStore();
    public generating: GeneratingStore = createGeneratingStore();
    public defaultMessages: util.Writable<PartialMessageAnyRole[]> = util.writable([]);

    constructor(public socket: Socket<ClientChannel, ServerChannel>) {
        this.socket = socket

        this.socket.on('connect', () => { console.log("connected"); this.connected.set(true); })
        this.socket.on('disconnect', () => { console.log("disconnected"); this.connected.set(false); })

        this.connected.subscribe(connected => console.log('connected', connected))

        this.socket.on('error', (err: any) => this.errors.add('Server', err))
        this.socket.on('error', () => this.generating.set(false))
        this.socket.on('config', (config: any) => this.config.setAll(config))

        this.socket.on('generating-started', () => this.generating.set(true))
        this.socket.on('generating-done', () => this.generating.set(false))

        this.socket.on('message-set-all', this.handleSetAllEvent.bind(this))
        this.socket.on('message-set', this.handleSetEvent.bind(this))
        this.socket.on('message-update', this.handleUpdateEvent.bind(this))

        this.socket.on('default-messages', (messages: PartialMessageAnyRole[]) => {
            this.defaultMessages.set(messages);
        })

        this.defaultMessages.subscribe(() => this.setMessagesIfDefault())
        this.messages.subscribe(() => this.setMessagesIfDefault())

        this.messages.subscribe(({ mapping, order }) => {
            this.rendered.set(
                renderMessages(mapping, order)
            )
            this.scroll.scroll('auto');
        })
    }

    setMessagesIfDefault() {
        if (this.messages.order.length === 0 && this.defaultMessages._.length > 0) {
            this.handleSetAllEvent(this.defaultMessages._);
        }
    }

    serialize(): SerializedChat {
        return {
            prompt: this.prompt.serialize(),
            messages: this.messages.serialize(),
            config: this.config._,
            errors: this.errors._,
            generating: this.generating._,
            defaultMessages: this.defaultMessages._,
        }
    }

    setFromSerialized(obj: SerializedChat) {
        obj.prompt && this.prompt.set(obj.prompt)
        obj.messages && this.messages.set(obj.messages);
        obj.config && this.config.set(obj.config);
        obj.errors && this.errors.set(obj.errors);
        obj.defaultMessages && this.defaultMessages.set(obj.defaultMessages);
        obj.generating !== undefined && this.generating.set(obj.generating);
    }

    handleSetAllEvent(messages: PartialMessageAnyRole[]) {
        if (this.generating._) return;
        this.messages.handleSetAllEvent(messages);
        this.scroll.scroll('force')
    }

    handleSetEvent(message: PartialMessageAnyRole) {
        if (this.generating._) return;
        const errorText = this.messages.handleSetEvent(message);
        if (errorText) {
            this.errors.add('Client', errorText);
        }
    }

    handleUpdateEvent(delta: Delta) {
        if (this.generating._) return;
        const errorText = this.messages.handleUpdateEvent(delta);
        if (errorText) {
            this.errors.add('Client', errorText);
        }
    }

    reset() {
        this.messages.handleSetAllEvent([]);
    }

    upload() {
        this.prompt.upload()
    }

    stopGenerating() {
        this.generating.set(false)
    }

    sendMessage() {
        if (this.generating._ || this.prompt.isEmpty()) {
            return;
        }
        const parts = this.prompt.getContentParts();
        const content = parts.length === 1 && parts[0].type === 'text' ? this.prompt.text._ : parts;
        this.messages.newUserMessage(content);
        this.prompt.clear();
        this.startGenerating()
    }

    changeUserMessageAndSubmit(id: string, newContent: string) {
        if (this.generating._) {
            return;
        }
        this.messages.updateUserMessageContent(id, newContent);
        this.regenerateAfterId(id);
    }

    regenerateOnAgentResponse(index: number) {
        if (this.generating._) {
            return;
        }
        const userResponse = this.rendered._[index - 1];
        if (!userResponse || userResponse.type !== 'user') {
            throw new Error("Tried to regenerate on an index not preceded by a user message")
        }
        this.regenerateAfterId(userResponse.id);
    }

    renderAssistantMarkdown(text: string) {
        return util.toMarkdownWrappedCode(text);
    }

    renderFunctionCallMarkdown(text: string) {
        return util.toMarkdownWrappedCode(text);
    }

    renderFunctionCallArgs(args: string | null | undefined): string {
        if (!args) return '';
        let content: string;
        try {
            content = JSON.stringify(JSON.parse(args), null, 2)
        } catch (e) {
            content = args;
        }
        return util.toMarkdown("```json\n" + content + "\n```");
    }

    renderFunctionTitle(name: string, functions: typeof this.config._.functions): string {
        const title = functions[name]?.title;
        return util.toMarkdown(title ?? `Function call to **\`${name}()\`**`)
    }

    getFunctionResultType(name: string, functions: typeof this.config._.functions): FunctionResultType {
        return functions[name]?.result_type ?? 'text';
    }

    getFunctionCallStatus(result: string | null, generating: boolean): FunctionCallStatus {
        const inProgress = generating && result === null;
        return result && util.isPythonErrorString(result)
            ? 'error' : inProgress ? 'progress' : 'complete';
    }

    userContentToText(content: string | ContentPart[]): string {
        if (typeof content === 'string') {
            return content;
        } else {
            for (const part of content) {
                if (part.type === 'text') {
                    return part.text;
                }
            }
            return '';
        }
    }

    userContentToFiles(content: string | ContentPart[]): FileContentPart[] {
        return typeof content === 'string'
            ? []
            : content.filter((part): part is FileContentPart => part.type !== 'text')
    }

    private regenerateAfterId(id: string) {
        this.messages.removeAfterId(id);
        this.startGenerating()
    }

    private startGenerating() {
        this.socket.emit('start-generating', { messages: this.messages.oaiMessages() });
        this.generating.set(true);
        this.scroll.scroll('force');
    }
}


type RenderedUserMessage = {
    id: string
    type: 'user'
    content: string | ContentPart[]
}


export type RenderedAgentPartContent = {
    type: 'content'
    content: string
}

export type RenderedAgentPartToolCall = {
    type: 'tool_call'
    id: string
    name: string
    arguments: string
    result: string | null
}

export type RenderedAgentPart = RenderedAgentPartContent | RenderedAgentPartToolCall


type RenderedAgentMessage = {
    type: 'agent'
    parts: RenderedAgentPart[]
}

type RenderedMessage = RenderedUserMessage | RenderedAgentMessage


function renderMessages(mapping: RecordOf<Message>, order: string[]): RenderedMessage[] {
    let messages: Message[] = order.map(id => mapping[id]);
    let msg: Message | undefined;

    let rendering: RenderedMessage[] = [];

    while (messages.length > 0 && (msg = messages.shift())) {
        if (msg.role === 'user') {
            rendering.push({ id: msg.id, type: 'user', content: msg.content });
            continue
        }

        const agent: RenderedAgentMessage = {
            type: 'agent',
            parts: [],
        }

        messages.unshift(msg);

        while (messages[0] && messages[0].role !== 'user') {
            const agentMsg = messages.shift() as AssistantMessage | ToolMessage;
            const role = agentMsg.role;
            const content = agentMsg.content ?? '';

            if (role === 'assistant') {
                agent.parts.push({
                    type: 'content',
                    content: content,
                })
                const { tool_calls } = agentMsg;
                if (tool_calls && tool_calls.length > 0) {
                    for (let { id, function: { name, arguments: args } } of tool_calls) {
                        name = name ?? '';
                        args = args ?? '';
                        agent.parts.push({ type: 'tool_call', id, name, arguments: args, result: null });
                    }
                }
                continue
            }

            const id = agentMsg.tool_call_id;
            for (let i = agent.parts.length - 1; i >= 0; i--) {
                let part = agent.parts[i];
                if (part.type === 'tool_call' && part.id === id) {
                    part.result = agentMsg.content;
                    break;
                }
            }
        }

        rendering.push(agent);
    }

    return rendering;
}
