export type Role = 'user' | 'assistant' | 'tool';
export const roles = new Set<Role>(['user', 'assistant', 'tool']);

// DELTA
// -----------------------------------------------------------------------------

// Tool call
export type ToolCallFirstDelta = {
    content?: null
    role?: 'assistant'
    tool_calls: [{
        id: string
        type: 'function'
        index: number
        function: {
            name: string
            arguments: string
        }
    }]
}
export type CallDeltaObjectFull = ToolCallFirstDelta['tool_calls'][0]

export type ToolCallExtraDelta = {
    content?: undefined
    role?: undefined
    tool_calls: [{
        id?: undefined
        type?: undefined
        index: number
        function: {
            name?: undefined
            arguments: string
        }
    }]
}
export type CallDeltaObjectPartial = ToolCallExtraDelta['tool_calls'][0]

export type ToolCallDelta = ToolCallFirstDelta | ToolCallExtraDelta

// Content
export type ContentFirstDelta = {
    content: string
    role: 'assistant'
    tool_calls?: undefined
}
export type ContentExtraDelta = {
    content: string
    role?: undefined
    tool_calls?: undefined
}
export type ContentDelta = ContentFirstDelta | ContentExtraDelta

// Any delta
export type Delta = ContentDelta | ToolCallDelta


// CONTENT PARTS
// -----------------------------------------------------------------------------

export type TextContentPart = {
    type: 'text'
    text: string
    image_url?: undefined
}
export type ImageContentPart = {
    type: 'image_url'
    image_url: {
        url: string
        detail?: 'low' | 'high' | 'auto'
    }
}
export type ContentPart = TextContentPart | ImageContentPart


// MESSAGES
// -----------------------------------------------------------------------------

export type ToolCall = {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}
export type SystemMessage = {
    role: 'system'
    content: string
    tool_calls?: undefined
    tool_call_id?: undefined
}
export type UserMessage = {
    role: 'user'
    content: string | ContentPart[]
    tool_calls?: undefined
    tool_call_id?: undefined
}
export type AssistantMessage = {
    role: 'assistant'
    content: string | null
    tool_calls?: ToolCall[]
    tool_call_id?: undefined
}
export type ToolMessage = {
    role: 'tool'
    content: string
    tool_call_id: string
    tool_calls?: undefined
}

export type RoleMessageTypeMap = {
    system: SystemMessage
    user: UserMessage
    assistant: AssistantMessage
    tool: ToolMessage
}

// Any message
export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage
