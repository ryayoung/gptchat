import * as util from '../util'
import type { FileContentPart, SerializedPrompt } from './prompt'
import type { ConfigStore, FunctionConfig, SerializedConfigStore, FunctionResultType } from './config'
import type { GeneratingStore } from './generating'
import type { CustomError, ErrorStore } from './error'
import type { Delta } from './delta'
import type {
	PartialMessageAnyRole,
	ContentPart,
	Message,
	AssistantMessage,
    UserMessage,
	ToolMessage,
} from './message'

import * as oai from './openai'
import { createConfigStore } from './config'
import { createGeneratingStore } from './generating'
import { createErrorStore } from './error'
import { Socket } from './socket'
import { Prompt } from './prompt'
import { AutoScroller } from './scroll'
import { updateMessageFromDelta, newMessageFromDelta } from './delta'
import {
    messageMappingOrderFromOpenai,
    convertMessageFromOpenai,
    messagesToOpenai,
} from './message'

const SERVER_CHANNELS = ['connect', 'start-generating', 'stop-generating'] as const
export type ServerChannel = (typeof SERVER_CHANNELS)[number]

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
] as const
export type ClientChannel = (typeof CLIENT_CHANNELS)[number]

export type SerializedChat = {
	prompt: SerializedPrompt
    msgMapping: RecordOf<Message>
	msgOrder: string[]
	config: SerializedConfigStore
	errors: CustomError[]
	generating: boolean
	defaultMessages: PartialMessageAnyRole[]
}

export type FunctionCallStatus = 'progress' | 'complete' | 'error'

export class Chat {
	public scroll = new AutoScroller()
	public rendered = util.writable<RenderedMessage[]>([])
	public connected = util.writable<boolean>(false)
    public msgMapping = util.writable<RecordOf<Message>>({})
    public msgOrder: string[] = []

	public prompt: Prompt = new Prompt()
	public config: ConfigStore = createConfigStore()
	public errors: ErrorStore = createErrorStore()
	public generating: GeneratingStore = createGeneratingStore()
	public defaultMessages = util.writable<PartialMessageAnyRole[]>([])

	constructor(public socket: Socket<ClientChannel, ServerChannel>) {
		this.socket = socket

		this.socket.on('connect', () => this.connected.set(true))
		this.socket.on('disconnect', () => this.connected.set(false))

		this.connected.subscribe((val) => log(val ? 'connected' : 'disconnected'))

		this.socket.on('error', (err: any) => this.errors.add('Server', err))
		this.socket.on('error', () => this.generating.set(false))
		this.socket.on('config', (config: any) => this.config.setAll(config))

		this.socket.on('generating-started', () => this.generating.set(true))
		this.socket.on('generating-done', () => this.generating.set(false))

		this.socket.on('message-set-all', this.handleSetAllEvent.bind(this))
		this.socket.on('message-set', this.handleSetEvent.bind(this))
		this.socket.on('message-update', this.handleUpdateEvent.bind(this))

		this.socket.on('default-messages', (messages: PartialMessageAnyRole[]) => {
			this.defaultMessages.set(messages)
		})

        this.generating.subscribe(val => log("generating", val))

		this.defaultMessages.subscribe(() => this.setMessagesIfDefault())

		this.msgMapping.subscribe(store => {
			this.rendered.set(renderMessages(store, this.msgOrder))
			this.scroll.scroll('auto')
		})
	}

	setMessagesIfDefault() {
		if (this.msgOrder.length === 0 && this.defaultMessages.get().length > 0) {
			this.handleSetAllEvent(this.defaultMessages.get())
		}
	}

	serialize(): SerializedChat {
		return {
            msgMapping: this.msgMapping.get(),
			msgOrder: this.msgOrder,
			prompt: this.prompt.serialize(),
			config: this.config.get(),
			errors: this.errors.get(),
			generating: this.generating.get(),
			defaultMessages: this.defaultMessages.get(),
		}
	}

	setFromSerialized(obj: SerializedChat) {
		obj.prompt && this.prompt.set(obj.prompt)
		obj.msgMapping && this.msgMapping.set(obj.msgMapping)
		obj.msgOrder && util.refillArray(this.msgOrder, obj.msgOrder)
		obj.config && this.config.set(obj.config)
		obj.errors && this.errors.set(obj.errors)
		obj.defaultMessages && this.defaultMessages.set(obj.defaultMessages)
		obj.generating !== undefined && this.generating.set(obj.generating)
	}

	reset() {
		this.handleSetAllEvent(this.defaultMessages.get());
	}

	upload() {
		this.prompt.upload()
	}

	stopGenerating() {
		this.generating.set(false)
	}

	sendMessage() {
		if (this.generating.get() || this.prompt.isEmpty()) {
			return
		}
		const parts = this.prompt.getContentParts()
		const content = parts.length === 1 && parts[0].type === 'text' ? this.prompt.text.get() : parts
		this.newUserMessage(content)
		this.prompt.clear()
		this.startGenerating()
	}

	changeUserMessageAndSubmit(id: string, newContent: string) {
		if (this.generating.get()) {
			return
		}
		this.updateUserMessageContent(id, newContent)
		this.regenerateAfterId(id)
	}

	regenerateOnAgentResponse(index: number) {
		if (this.generating.get()) {
			return
		}
		const userResponse = this.rendered.get()[index - 1]
		if (!userResponse || userResponse.type !== 'user') {
			throw new Error('Tried to regenerate on an index not preceded by a user message')
		}
		this.regenerateAfterId(userResponse.id)
	}

	renderAssistantMarkdown(text: string) {
		return util.toMarkdownWrappedCode(text)
	}

	renderFunctionResult(
		result: string | null,
		name: string,
		functions: RecordOf<FunctionConfig>
	): string | null {
		if (result === null) return null
		const result_type = functions[name]?.result?.type
		if (!result_type) return result
		switch (result_type) {
			case 'markdown':
				return util.toMarkdownWrappedCode(result)
			case 'html':
				return result
			case 'text':
				return result
			case 'json':
				return util.toMarkdown(util.wrapInMarkdownCodeBlock(util.prettifyJsonString(result), 'json'))
			default:
				return util.toMarkdown(util.wrapInMarkdownCodeBlock(result, result_type))
		}
	}

	renderFunctionCallArgs(
		args: string | null | undefined,
		name: string,
		functions: RecordOf<FunctionConfig>
	): string {
		if (!args) return ''
		const showKeyAsCode = functions[name]?.arguments?.show_key_as_code
		if (showKeyAsCode && showKeyAsCode.key) {
			const key = showKeyAsCode.key
			const language = showKeyAsCode.language ?? 'plaintext'
			const parsed = util.parseIncompleteJson(args)

			if (parsed && parsed[key]) {
				const value = parsed[key]
				const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
				return util.toMarkdown(util.wrapInMarkdownCodeBlock(content, language))
			}
		}
		return util.toMarkdown(util.wrapInMarkdownCodeBlock(util.prettifyJsonString(args), 'json'))
	}

	getArgsTitle(name: string, functions: RecordOf<FunctionConfig>): string {
		const title = functions[name]?.arguments?.title
		return util.toMarkdown(title ?? 'Arguments')
	}

	getResultTitle(name: string, functions: RecordOf<FunctionConfig>): string {
		const title = functions[name]?.result?.title
		return util.toMarkdown(title ?? 'Result')
	}

	renderFunctionHeader(name: string, functions: RecordOf<FunctionConfig>): string | null {
		const header = functions[name]?.header
		if (header?.show === false) return null
		return util.toMarkdown(header?.text ?? `Function call to **\`${name}()\`**`)
	}

	getFunctionResultType(name: string, functions: RecordOf<FunctionConfig>): FunctionResultType {
		return functions[name]?.result?.type ?? 'text'
	}

	getFunctionCallStatus(result: string | null, generating: boolean): FunctionCallStatus {
		const inProgress = generating && result === null
		return result && util.isPythonErrorString(result) ? 'error' : inProgress ? 'progress' : 'complete'
	}

	userContentToText(content: string | ContentPart[]): string {
		if (typeof content === 'string') {
			return content
		} else {
			for (const part of content) {
				if (part.type === 'text') {
					return part.text
				}
			}
			return ''
		}
	}

	userContentToFiles(content: string | ContentPart[]): FileContentPart[] {
		return typeof content === 'string'
			? []
			: content.filter((part): part is FileContentPart => part.type !== 'text')
	}

	private regenerateAfterId(id: string) {
		this.removeAfterId(id)
		this.startGenerating()
	}

	private startGenerating() {
		this.socket.emit('start-generating', { messages: this.oaiMessages() })
		this.generating.set(true)
		this.scroll.scroll('force')
        this.rendered.set(renderMessages(this.msgMapping.get(), this.msgOrder, true))
	}

    // MESSAGES
    // -----------------------------------------------------------------------------
 
    oaiMessages(): oai.Message[] {
        return messagesToOpenai(this.msgMapping.get(), this.msgOrder);
    }

    newUserMessage(content: string | ContentPart[]): void {
        this.setMessage({
            id: util.newId(),
            role: 'user',
            content,
        })
    }

    updateUserMessageContent(id: string, content: string): void {
        this.msgMapping.update(store => {
            const msg = store[id] as UserMessage;
            if (msg.role !== 'user') {
                console.error(`Invalid message update. Existing message '${id}' is not a user message.`)
                return store;
            }
            if (typeof msg.content === 'string') {
                msg.content = content;
                return store;
            }
            for (const part of msg.content) {
                if (part.type === 'text') {
                    part.text = content;
                    return store;
                }
            }
            throw new Error(`Message ${id} has no text content part.`);
        })
    }

    removeAfterId(id: string) {
        const index = this.msgOrder.indexOf(id);
        index !== -1 && this.removeAfterIndex(index);
    }

    removeAfterIndex(index: number) {
        const id = this.msgOrder[index];
        if (!id) {
            return;
        }
        const removed = this.msgOrder.splice(index + 1);
        this.msgMapping.update(store => {
            for (const id of removed) {
                delete store[id];
            }
            return store;
        })
    }

    handleSetAllEvent(messages: PartialMessageAnyRole[]): void {
        if (!this.generating.get()) return
        const { mapping, order } = messageMappingOrderFromOpenai(messages);
        util.refillArray(this.msgOrder, order)
        this.msgMapping.set(mapping)
        this.scroll.scroll('force')
    }

    handleSetEvent(message: PartialMessageAnyRole) {
		if (!this.generating.get()) return
        const msg = convertMessageFromOpenai(message);
        if (!msg) {
            return this.errors.add('Client', `Invalid message: ${message}`)
        }
        this.setMessage(msg);
    }

    handleUpdateEvent(delta: Delta) {
		if (!this.generating.get()) return
        if (delta.role && delta.role !== 'assistant') {
            return this.errors.add('Client', `Invalid message update: role must be assistant.: ${delta}`);
        }
        const id = delta.id;
        if (!id) {
            return this.errors.add('Client', `Invalid message update: id not defined.: ${delta}`);
        }
        if (id in this.msgMapping.get()) {
            return this.updateExistingFromDelta(id, delta);
        } else {
            return this.addNewFromDelta(id, delta);
        }
    }

    private addNewFromDelta(id: string, delta: Delta) {
        const msg = newMessageFromDelta(id, delta);
        if ('error' in msg) {
            return this.errors.add('Client', msg.error);
        }
        this.setMessage(msg);
    }

    private updateExistingFromDelta(id: string, delta: Delta) {
        this.msgMapping.update(store => {
            const msg = store[id];
            if (msg?.role === 'assistant') {
                updateMessageFromDelta(msg, delta);
            } else {
                this.errors.add('Client', `Invalid message update. Existing message '${id}' is not an assistant message.`);
            }
            return store;
        })
    }

    private setMessage(msg: Message) {
        this.msgMapping.update(store => {
            if (!(msg.id in store)) {
                this.msgOrder.push(msg.id);
            }
            store[msg.id] = msg;
            return store;
        })
    }
}

type RenderedUserMessage = {
	id: string
	type: 'user'
	content: string | ContentPart[]
}

export type RenderedAgentPartContent = {
    id?: undefined
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

function renderMessages(mapping: RecordOf<Message>, order: string[], generating: boolean = false): RenderedMessage[] {
	let messages: Message[] = order.map((id) => mapping[id])
	let msg: Message | undefined

	let rendering: RenderedMessage[] = []

	while (messages.length > 0 && (msg = messages.shift())) {
		if (msg.role === 'user') {
			rendering.push({ id: msg.id, type: 'user', content: msg.content })
			continue
		}

		const agent: RenderedAgentMessage = {
			type: 'agent',
			parts: [],
		}

		messages.unshift(msg)

		while (messages[0] && messages[0].role !== 'user') {
			const agentMsg = messages.shift() as AssistantMessage | ToolMessage
			const role = agentMsg.role
			const content = agentMsg.content ?? ''

			if (role === 'assistant') {
				agent.parts.push({
					type: 'content',
					content: content,
				})
				const { tool_calls } = agentMsg
				if (tool_calls && tool_calls.length > 0) {
					for (let {
						id,
						function: { name, arguments: args },
					} of tool_calls) {
						name = name ?? ''
						args = args ?? ''
						agent.parts.push({ type: 'tool_call', id, name, arguments: args, result: null })
					}
				}
				continue
			}

			const id = agentMsg.tool_call_id
			for (let i = agent.parts.length - 1; i >= 0; i--) {
				let part = agent.parts[i]
				if (part.type === 'tool_call' && part.id === id) {
					part.result = agentMsg.content
					break
				}
			}
		}

		rendering.push(agent)
	}

    if (generating && rendering[rendering.length - 1]?.type === 'user') {
        rendering.push({
            type: 'agent',
            parts: [{ type: 'content', content: '' }],
        })
    }

	return rendering
}
