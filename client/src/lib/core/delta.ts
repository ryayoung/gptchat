import * as oai from './openai';
import type { AssistantMessage } from './message';

export type Delta = oai.Delta & {
    id?: string
}


// HANDLERS
// -----------------------------------------------------------------------------

export function newMessageFromDelta(id: string, delta: Delta): AssistantMessage | { error: string } {
    const role = 'assistant';
    const content: string = 'content' in delta && delta.content
        ? delta.content
        : '';

    const hasToolCalls = delta.tool_calls && delta.tool_calls.length > 0;
    if (!hasToolCalls) {
        return { id, role, content };
    }
    const call: oai.CallDeltaObjectFull | oai.CallDeltaObjectPartial = delta.tool_calls[0];

    if (!call.id) {
        return { error: 'Tool call has no id. Received a partial delta for a tool call that does not exist yet.' }
    }

    if (call.type !== 'function') {
        return { error: 'Currently, only function tool calls are supported.' };
    }

    const type = 'function';
    let { id: callId, function: { name, arguments: args } } = call;
    const func = {
        name: name || '',
        arguments: args || '',
    }
    return { id, role, content, tool_calls: [{ id: callId, type, function: func }] };
}


export function updateMessageFromDelta(msg: AssistantMessage, delta: Delta): true | undefined {
    if (msg.id !== delta.id) {
        throw new Error('Message id and delta id must match');
    }
    if (delta.content) {
        msg.content = msg.content !== null
            ? msg.content + delta.content
            : delta.content;
    }
    const deltaHasToolCalls = delta.tool_calls && delta.tool_calls.length > 0;
    if (!deltaHasToolCalls) {
        return;
    }
    const call: oai.CallDeltaObjectFull | oai.CallDeltaObjectPartial = delta.tool_calls[0];
    const index = call.index;
    if (typeof index !== 'number' || !call.function) {
        return;
    }
    const callIsPartial = !call.id || !call.function?.name;

    if (!msg.tool_calls) {
        msg.tool_calls = [];
    }
    const prevNumToolCalls = msg.tool_calls.length;

    const callIsOutOfBounds = index > prevNumToolCalls;
    const callIsNew = index === prevNumToolCalls;

    if (callIsOutOfBounds) {
        return;
    }

    if (callIsNew) {
        if (callIsPartial) {
            return;
        }
        const type = 'function';
        const { id, function: { name, arguments: args} } = call;

        msg.tool_calls.push({ id, type, function: { name, arguments: args } });
        return true;
    }

    const prevCall = msg.tool_calls[index];
    const { function: { name, arguments: args } } = call;
    if (name) {
        prevCall.function.name = name;
    }
    if (args) {
        prevCall.function.arguments += args;
    }
}
