import * as util from '../util';
import * as oai from './openai'
import type { BinaryContentPart } from './prompt.svelte';

type Role = 'user' | 'assistant' | 'tool';
const roles = new Set<Role>(['user', 'assistant', 'tool']);


export type ContentPart = oai.ContentPart | BinaryContentPart


export type UserMessage = {
    id: string
    role: 'user'
    content: string | ContentPart[]
}

export type SystemMessage = oai.SystemMessage & {
    id: string
}
export type AssistantMessage = oai.AssistantMessage & {
    id: string
}

export type ToolMessage = oai.ToolMessage & {
    id: string
}

export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage


type RoleMessageTypeMap = {
    system: SystemMessage
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

    system(msg) {
        return {
            role: 'system',
            id: 'id' in msg && msg.id ? msg.id : util.newId(),
            content: msg.content ?? '',
        }
    },

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
                if (!(call.id && call.function?.name && typeof call.function?.arguments === 'string')) {
                    log('Message has invalid tool call. Skipping:', msg)
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

export function convertMessageFromOpenai<T extends keyof oai.RoleMessageTypeMap>(msg: PartialMessageForRole<T>): RoleMessageTypeMap[T] | null {
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

    system(msg) {
        let res: oai.SystemMessage = {
            role: 'system',
            content: msg.content,
        } 
        return res;
    },

    user(msg) {
        let res: oai.UserMessage = { role: 'user', content: '' }

        if (typeof msg.content === 'string') {
            res.content = msg.content;
        } else {
            res.content = [];
            for (const part of msg.content) {
                if (part.type === 'binary') {
                    res.content.push(part as unknown as oai.ContentPart)
                } else {
                    res.content.push(part);
                }
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
