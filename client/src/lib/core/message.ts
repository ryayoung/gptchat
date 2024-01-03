import * as util from '../util';
import * as oai from './openai'
import type { BinaryContentPart } from './prompt';

import { 
    newMessageFromDelta,
    updateMessageFromDelta,
    type Delta,
} from './delta';

type Role = 'user' | 'assistant' | 'tool';
const roles = new Set<Role>(['user', 'assistant', 'tool']);


export type ContentPart = oai.ContentPart | BinaryContentPart


export type UserMessage = {
    id: string
    role: 'user'
    content: string | ContentPart[]
}

export type AssistantMessage = oai.AssistantMessage & {
    id: string
}

export type ToolMessage = oai.ToolMessage & {
    id: string
}

export type Message = UserMessage | AssistantMessage | ToolMessage


type RoleMessageTypeMap = {
    user: UserMessage
    assistant: AssistantMessage
    tool: ToolMessage
}

// CONVERT FROM OPENAI INPUTS
// -----------------------------------------------------------------------------
export type PartialMessageAnyRole = Partial<oai.Message | Message>;
type PartialMessageForRole<T extends keyof oai.RoleMessageTypeMap> = Partial<oai.RoleMessageTypeMap[T] | RoleMessageTypeMap[T]>;


type MessageFromOpenaiConverters = {
    [K in keyof oai.RoleMessageTypeMap]:
        (msg: Partial<oai.RoleMessageTypeMap[K] | RoleMessageTypeMap[K]>) => RoleMessageTypeMap[K] | null
}

export const messageFromOpenai: MessageFromOpenaiConverters = {

    user(msg) {
        return {
            role: 'user',
            id: 'id' in msg && msg.id ? msg.id : util.newId(),
            content: !!msg.content ? msg.content : '',
        }
    },

    assistant(msg) {
        const tool_calls: oai.ToolCall[] | undefined = msg.tool_calls && msg.tool_calls.length > 0
            ? msg.tool_calls
            : undefined;

        if (tool_calls) {
            for (const call of tool_calls) {
                if (!(call.id && call.function?.name && call.function?.arguments)) {
                    return null;
                }
            }
        }
        return {
            role: 'assistant',
            id: 'id' in msg && msg.id ? msg.id : util.newId(),
            content: msg.content ?? '',
            tool_calls,
        }
    },

    tool(msg) {
        if (!msg.tool_call_id) {
            return null;
        }
        return {
            role: 'tool',
            id: 'id' in msg && msg.id ? msg.id : util.newId(),
            content: msg.content ?? '',
            tool_call_id: msg.tool_call_id,
        }
    },
}

function convertMessageFromOpenai<T extends keyof oai.RoleMessageTypeMap>(msg: PartialMessageForRole<T>): RoleMessageTypeMap[T] | null {
    if (msg.role && msg.role in messageFromOpenai) {
        return messageFromOpenai[msg.role as T](msg);
    }
    return null;
}

export function messagesFromOpenai(messages: PartialMessageAnyRole[]): Message[] {
    return messages
        .map(msg => convertMessageFromOpenai(msg))
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
}

type MessageMappingOrder = {
    mapping: RecordOf<Message>
    order: string[]
}

export function messageMappingOrderFromOpenai(partialMessages: PartialMessageAnyRole[]): MessageMappingOrder {
    const messages = messagesFromOpenai(partialMessages);

    return {
        order: messages.map(msg => msg.id),
        mapping: util.objectFromKeyedRecords(messages, 'id'),
    }
}

// CONVERT TO OPENAI
// -----------------------------------------------------------------------------

type MessageToOpenaiConverters = {
    [K in keyof RoleMessageTypeMap]: (msg: RoleMessageTypeMap[K]) => oai.RoleMessageTypeMap[K]
}

export const messageToOpenai: MessageToOpenaiConverters = {

    user(msg) {
        let res: oai.UserMessage = { role: 'user', content: '' }

        if (typeof msg.content === 'string') {
            res.content = msg.content;
        } else {
            res.content = [];
            for (const part of msg.content) {
                part.type !== 'binary' && res.content.push(part);
            }
        }
        return res;
    },

    assistant(msg) {
        let res: oai.AssistantMessage = { role: 'assistant', content: msg.content }

        if (msg.tool_calls && msg.tool_calls.length > 0) {
            res.tool_calls = msg.tool_calls;
        }
        return res;
    },

    tool(msg) {
        let res: oai.ToolMessage = {
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_call_id,
        }
        return res;
    },
}
function convertMessageToOpenai<T extends keyof RoleMessageTypeMap>(msg: RoleMessageTypeMap[T]): oai.RoleMessageTypeMap[T] {
    return messageToOpenai[msg.role as T](msg);
}

export function messagesToOpenai(mapping: RecordOf<Message>, order: string[]): oai.Message[] {
    return order
        .map(id => convertMessageToOpenai(mapping[id]))
        .filter(msg => msg !== null);
}


// STORE
// -----------------------------------------------------------------------------

export type SerializedMessages = {
    mapping: RecordOf<Message>
    order: string[]
}

export class Messages {
    public readonly mapping = util.writable<RecordOf<Message>>({})
    public readonly order: string[] = []

    subscribe(fn: (props: SerializedMessages) => void) {
        return this.mapping.subscribe(mapping => fn({ mapping, order: this.order }))
    }

    set(props: SerializedMessages) {
        util.refillArray(this.order, props.order);
        this.mapping.set(props.mapping);
    }

    oaiMessages(): oai.Message[] {
        return messagesToOpenai(this.mapping._, this.order);
    }

    serialize(): SerializedMessages {
        return {
            mapping: this.mapping._,
            order: this.order,
        }
    }

    newUserMessage(content: string | ContentPart[]): void {
        this.setMessage({
            id: util.newId(),
            role: 'user',
            content,
        })
    }

    updateUserMessageContent(id: string, content: string): void {
        this.mapping.update(store => {
            const msg = store[id] as UserMessage;
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

    removeAfterId(id: string): void {
        const index = this.order.indexOf(id);
        index !== -1 && this.removeAfterIndex(index);
    }

    removeAfterIndex(index: number): void {
        const id = this.order[index];
        if (!id) {
            return;
        }
        const removed = this.order.splice(index + 1);
        this.mapping.update(store => {
            for (const id of removed) {
                delete store[id];
            }
            return store;
        })
    }

    handleSetAllEvent(messages: PartialMessageAnyRole[]): void {
        const { mapping, order } = messageMappingOrderFromOpenai(messages);
        return this.set({ order, mapping });
    }

    handleSetEvent(message: PartialMessageAnyRole): string | undefined {
        const msg = convertMessageFromOpenai(message);
        if (!msg) {
            return `Invalid message: ${message}`;
        }
        this.setMessage(msg);
    }

    handleUpdateEvent(delta: Delta): string | undefined {
        if (delta.role && delta.role !== 'assistant') {
            return `Invalid message update: role must be assistant.: ${delta}`;
        }
        const id = delta.id;
        if (!id) {
            return `Invalid message update: id not defined.: ${delta}`;
        }
        if (id in this.mapping._) {
            return this.updateExistingFromDelta(id, delta);
        } else {
            return this.addNewFromDelta(id, delta);
        }
    }


    private addNewFromDelta(id: string, delta: Delta): string | undefined {
        const msg = newMessageFromDelta(id, delta);
        if ('error' in msg) {
            return msg.error;
        }
        this.setMessage(msg);
    }

    private updateExistingFromDelta(id: string, delta: Delta): string | undefined {
        let error: string | undefined = undefined;
        this.mapping.update(store => {
            const msg = store[id];
            if (msg?.role === 'assistant') {
                updateMessageFromDelta(msg, delta);
            } else {
                error = `Invalid message update. Existing message '${id}' is not an assistant message.`;
            }
            return store;
        })
        return error;
    }

    
    private setMessage(msg: Message) {
        if (!(msg.id in this.mapping._)) {
            this.order.push(msg.id);
        }
        this.mapping.update(store => {
            store[msg.id] = msg;
            return store;
        })
    }
}


export default Messages;
