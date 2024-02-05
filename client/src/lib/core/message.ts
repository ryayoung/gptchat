import * as util from '../util'
import * as oai from './openai'
import type { BinaryContentPart } from './prompt.svelte'

type Role = 'user' | 'assistant' | 'tool'
const roles = new Set<Role>(['user', 'assistant', 'tool'])

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
export type PartialMessageAnyRole = Partial<oai.Message | Message>
type PartialMessageForRole<T extends keyof oai.RoleMessageTypeMap> = Partial<
    oai.RoleMessageTypeMap[T] | RoleMessageTypeMap[T]
>

type MessageFromOpenaiConverters = {
    [K in keyof oai.RoleMessageTypeMap]: (
        msg: Partial<oai.RoleMessageTypeMap[K] | RoleMessageTypeMap[K]>, role: K, id: string
    ) => RoleMessageTypeMap[K] | null
}

export const messageFromOpenai: MessageFromOpenaiConverters = {
    system(msg, role, id) {
        return { role, id, content: msg.content ?? '' }
    },

    user(msg, role, id) {
        return { role, id, content: msg.content ?? '' }
    },

    assistant(msg, role, id) {
        const tool_calls: oai.ToolCall[] | undefined =
            msg.tool_calls && msg.tool_calls.length > 0 ? msg.tool_calls : undefined

        if (tool_calls) {
            for (const call of tool_calls) {
                if (!(call.id && call.function?.name && typeof call.function?.arguments === 'string')) {
                    log('Message has invalid tool call. Skipping:', msg)
                    return null
                }
            }
        }
        return { role, id, content: msg.content ?? '', tool_calls }
    },

    tool(msg, role, id) {
        return msg.tool_call_id
            ? { role, id, content: msg.content ?? '', tool_call_id: msg.tool_call_id }
            : null
    },
}

export function convertMessageFromOpenai<T extends keyof oai.RoleMessageTypeMap>(
    msg: PartialMessageForRole<T>
): RoleMessageTypeMap[T] | null {
    if (msg.role && msg.role in messageFromOpenai) {
        return messageFromOpenai[msg.role as T](msg, msg.role as T, 'id' in msg && msg.id ? msg.id : util.newId())
    }
    return null
}

export function messagesFromOpenai(messages: PartialMessageAnyRole[]): Message[] {
    return messages
        .map((msg) => convertMessageFromOpenai(msg))
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
}

type MessageMappingOrder = {
    mapping: RecordOf<Message>
    order: string[]
}

export function messageMappingOrderFromOpenai(partialMessages: PartialMessageAnyRole[]): MessageMappingOrder {
    const messages = messagesFromOpenai(partialMessages)

    return {
        order: messages.map((msg) => msg.id),
        mapping: util.objectFromKeyedRecords(messages, 'id'),
    }
}

// CONVERT TO OPENAI
// -----------------------------------------------------------------------------

type MessageToOpenaiConverters = {
    [K in keyof RoleMessageTypeMap]: (msg: RoleMessageTypeMap[K], role: K) => oai.RoleMessageTypeMap[K]
}

export const messageToOpenai: MessageToOpenaiConverters = {
    system(msg, role) {
        return { role, content: msg.content }
    },

    user(msg, role) {
        return {
            role,
            content: typeof msg.content === 'string'
                ? msg.content
                : msg.content.map(part => part.type === 'binary' ? part as unknown as oai.ContentPart : part)
        }
    },

    assistant(msg, role) {
        return {
            role,
            content: msg.content,
            tool_calls: msg.tool_calls && msg.tool_calls.length > 0 ? msg.tool_calls : undefined,
        }
    },

    tool(msg, role) {
        return {
            role,
            content: msg.content,
            tool_call_id: msg.tool_call_id,
        }
    },
}
function convertMessageToOpenai<T extends keyof RoleMessageTypeMap>(
    msg: RoleMessageTypeMap[T]
): oai.RoleMessageTypeMap[T] {
    return messageToOpenai[msg.role as T](msg, msg.role as T)
}

export function messagesToOpenai(mapping: RecordOf<Message>, order: string[]): oai.Message[] {
    return order.map((id) => convertMessageToOpenai(mapping[id])).filter((msg) => msg !== null)
}
