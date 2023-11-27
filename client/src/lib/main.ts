import { writable, get, derived, type Readable } from 'svelte/store';
import { tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';
import { debounce, throttleIgnore } from '$lib/utils';
import {
    socketEmit,
    socketOn,
} from '$lib/socket';

type UserMessage = {
    id: string
    role: "user"
    content: string
}

export type FunctionCall = {
    name: string
    arguments: string | null
}

type AssistantMessage = {
    id: string
    role: "assistant"
    content: string | null
    function_call: FunctionCall | null
}

type FunctionMessage = {
    id: string
    role: "function"
    name: string
    content: string
}

export type Message = UserMessage | AssistantMessage | FunctionMessage

type MessageAny = {
    id?: string
    role?: string
    content?: string | null
    name?: string
    function_call?: null | {
        name?: string
        arguments?: string
    }
}

type OpenAIUserMessage = {
    role: "user"
    content: string
}
type OpenAIAssistantMessage = {
    role: 'assistant'
    content: string | null
    function_call?: FunctionCall
}
type OpenAIMessage = OpenAIUserMessage | OpenAIAssistantMessage | FunctionMessage

type ContentPlan = {
    type: 'content'
    id: string
}

type FunctionPlan = {
    type: 'function'
    callId: string
    resultId: string | null
}

type UserPlan = {
    type: 'user'
    id: string
}

export type PlanPart = ContentPlan | FunctionPlan

type AssistantPlan = {
    type: 'assistant'
    parts: PlanPart[]
}

export type PlanMessage = UserPlan | AssistantPlan


type AssistantDelta = {
    id: string
    role?: "assistant"
    content?: string | null
    function_call?: {
        name?: string
        arguments?: string
    }
}

type Delta = AssistantDelta | FunctionMessage | UserMessage

export type FunctionCallProgressMode = 'progress' | 'complete' | 'error';

export type FunctionDisplayConfig = {
    progress?: string
    complete?: string
    error?: string
}

export const functionDisplayConfig = writable<RecordOf<FunctionDisplayConfig>>({});
export const messages = writable<RecordOf<Message>>({});
export const messageOrder = writable<string[]>([]);
export const plan = writable<Array<PlanMessage>>([]);
export const generating = writable<boolean>(false);
export const prompt = writable<string>('');
export const promptSendMode = writable<'enter' | 'ctrl-enter'>('enter');
export const scrollIntoViewDiv = writable<HTMLDivElement | null>(null);
export const scrollContainerDiv = writable<HTMLDivElement | null>(null);
export const autoScrollEnabled = writable<boolean>(true);

let lastScrollHeight: number = 0;

export function scrollChatDiv(ifChanged: boolean = false) {
    const div = get(scrollContainerDiv);
    if (!div) return;
    const { scrollHeight } = div;
    if (!ifChanged || scrollHeight !== lastScrollHeight) {
        const ghostDiv = get(scrollIntoViewDiv);
        if (ghostDiv) {
            ghostDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    lastScrollHeight = scrollHeight;
}

export const autoScrollChatIfEnabled = throttleIgnore(() => {
    if (get(autoScrollEnabled)) {
        tick().then(() => {
            scrollChatDiv(true);
        })
    }
}, 200);

export function forceAutoScrollChat() {
    tick().then(() => {
        scrollChatDiv();
    })
    autoScrollEnabled.set(true);
}

export function deleteAfterUserMessage(id: string) {
    const $messageOrder = get(messageOrder);
    const $messages = get(messages);
    const index = $messageOrder.indexOf(id);
    const msg = $messages[id];
    if (msg.role !== 'user') return;
    if (index === -1 || index >= $messageOrder.length - 1) return;

    const deletedItems = $messageOrder.slice(index + 1);

    messageOrder.update(store => {
        store.splice(index + 1);
        return store;
    })

    setPlan();

    messages.update(store => {
        for (const id of deletedItems) {
            delete store[id];
        }
        return store;
    })
}


export function planFromMessages(messageList: Message[]): PlanMessage[] {
    const messageStack: Message[] = [...messageList];
    const newPlan: PlanMessage[] = [];

    while (messageStack.length > 0) {
        const message = messageStack.shift();
        if (!message) continue;

        if (message.role === 'user') {
            newPlan.push({
                type: 'user',
                id: message.id,
            });

        } else if (message.role === 'assistant') {
            let assistantPlan: AssistantPlan = {
                type: 'assistant',
                parts: [],
            };
            let lastMessage: AssistantMessage | FunctionMessage = message;

            while (true) {
                const { id, role, content } = lastMessage;

                if (role === 'assistant') {
                    const { function_call } = lastMessage;

                    if (content !== null) {
                        assistantPlan.parts.push({ type: 'content', id });
                    }

                    if (function_call !== null) {
                        let funcPlan: FunctionPlan = {
                            type: 'function',
                            callId: id,
                            resultId: null,
                        };
                        if (messageStack.length > 0) {
                            const next = messageStack[0];
                            if (next.role === 'function' && next.name === function_call.name) {
                                funcPlan.resultId = next.id;
                                messageStack.shift();
                            }
                        }
                        assistantPlan.parts.push(funcPlan);
                    }
                }
                const next = messageStack[0];
                if (next && next.role !== 'user') {
                    lastMessage = next;
                    messageStack.shift();
                } else {
                    break;
                }
            }
            newPlan.push(assistantPlan);
        }
    }
    return newPlan;
}


export function setPlan() {
    plan.update(store => {
        const $messageOrder = get(messageOrder);
        const $messages = get(messages);
        const messageList: Message[] = $messageOrder.map(id => $messages[id]);
        store = planFromMessages(messageList);
        return store;
    })
}

export function addMessage(message: Message) {
    messages.update(store => {
        store[message.id] = message;
        return store;
    })
    messageOrder.update(store => {
        store.push(message.id);
        return store;
    })
    setPlan();
}

function newMessageFromDelta(delta: Delta): Message {
    if (!delta.role) throw new Error("Delta must have a role");

    if (delta.role === 'function' || delta.role === 'user') {
        return delta;
    } else {
        return {
            id: delta.id,
            role: 'assistant',
            content: delta.content ?? null,
            function_call: !delta.function_call ? null : {
                name: delta.function_call.name ?? '',
                arguments: delta.function_call.arguments ?? '',
            },
        };
    }

} 

function appendToUnknownString(existing: string | null | undefined, toAppend: string): string {
    if (existing) {
        return existing + toAppend;
    } else {
        return toAppend;
    }
}

function updateMessageFromDelta(existing: AssistantMessage, delta: AssistantDelta) {
    let markForPlanUpdate = false;
    if (delta.content) {
        if (existing.content === null) {
            existing.content = delta.content;
            markForPlanUpdate = true;
        } else {
            existing.content += delta.content;
        }
    }
    if (delta.function_call) {
        if (existing.function_call) {
            if (delta.function_call.name) {
                existing.function_call.name = delta.function_call.name;
            }
            if (delta.function_call.arguments) {
                existing.function_call.arguments = appendToUnknownString(existing.function_call.arguments, delta.function_call.arguments);
            }
        } else {
            existing.function_call = {
                name: delta.function_call.name ?? '',
                arguments: delta.function_call.arguments ?? null,
            };
            markForPlanUpdate = true;
        }
    }
    return markForPlanUpdate;
}

socketOn('update-message', (message: Delta) => {
    if (!get(generating)) return;

    if (message.id in get(messages)) {
        messages.update(store => {
            const existing = store[message.id];
            if (existing.role === 'assistant' && message.role !== 'function' && message.role !== 'user') {
                const needToUpdatePlan = updateMessageFromDelta(existing, message);
                if (needToUpdatePlan) {
                    tick().then(() => {
                        setPlan();
                    })
                }
                tick().then(() => {
                    autoScrollChatIfEnabled();
                })
            }
            return store;
        })
    } else {
        if (message.role) {
            addMessage(newMessageFromDelta(message));
            tick().then(() => {
                autoScrollChatIfEnabled();
            })
        }
    }
})

export function getCleanedMessagesList(): OpenAIMessage[] {
    const $messageOrder = get(messageOrder);
    const $messages = get(messages);
    return $messageOrder.map(id => {
        const { id: _, ...result } = $messages[id];
        if ('function_call' in result && result.function_call === null) {
            const { function_call: _, ...newResult } = result;
            return newResult as OpenAIAssistantMessage;
        }
        return result as OpenAIUserMessage | FunctionMessage;
    });
}


export function sendMessage() {
    if (get(generating)) return;

    const $prompt = get(prompt);
    if ($prompt.trim() === '') return;

    const msg: UserMessage = {
        id: uuidv4(),
        role: 'user',
        content: $prompt,
    };
    addMessage(msg);
    socketEmit('send-message', { messages: getCleanedMessagesList() });
    generating.set(true);
    prompt.set('');

    forceAutoScrollChat();
}

export function stopGenerating() {
    socketEmit('stop-generating');
    generating.set(false);
}

socketOn('finish-generating', () => generating.set(false));

type Config = {
    functions?: RecordOf<FunctionDisplayConfig | string>
    messages?: MessageAny[]
}

socketOn('config', (config: Config) => {
    for (const key in config) {
        const k = key as keyof Config;
        const val = config[k];
        if (val && k in configHandler) {
            configHandler[k](val as any);
        }
    }
})

const configHandler = {
    functions(functions: RecordOf<FunctionDisplayConfig | string>) {
        const newConfig: RecordOf<FunctionDisplayConfig> = {};
        for (const funcName in functions) {
            const conf = functions[funcName];
            if (typeof conf === 'string') {
                newConfig[funcName] = {
                    progress: conf,
                    complete: conf,
                    error: conf,
                };
            } else {
                newConfig[funcName] = {
                    progress: conf.progress ?? undefined,
                    complete: conf.complete ?? undefined,
                    error: conf.error ?? undefined,
                }
            }
        }

        functionDisplayConfig.set(newConfig);
    },
    messages(messageList: MessageAny[]) {
        const newMessages: RecordOf<Message> = {};
        const newMessageOrder: string[] = [];
        function addMsg(msg: Message) {
            newMessages[msg.id] = msg;
            newMessageOrder.push(msg.id);
        }
        for (const message of messageList) {
            if (!message.id) {
                message.id = uuidv4();
            }
            if (!message.role) {
                continue;
            }
            if (message.role === 'user') {
                addMsg({
                    id: message.id,
                    role: 'user',
                    content: message.content ?? '',
                });
            } else if (message.role === 'function') {
                addMsg({
                    id: message.id,
                    role: 'function',
                    name: message.name ?? '',
                    content: message.content ?? '',
                });
            } else if (message.role === 'assistant') {
                let function_call: FunctionCall | null;
                if (!message.function_call) {
                    function_call = null;
                } else {
                    function_call = {
                        name: message.function_call.name ?? '',
                        arguments: message.function_call.arguments ?? '',
                    };
                }
                addMsg({
                    id: message.id,
                    role: 'assistant',
                    content: message.content ?? null,
                    function_call,
                });
            }
        }

        messages.set(newMessages);
        messageOrder.set(newMessageOrder);
        setPlan();

        forceAutoScrollChat();
    },
}

export function getLastUserMessageBeforePlan(planIndex: number): string | null {
    const $plan = get(plan);
    for (let i = planIndex - 1; i >= 0; i--) {
        const part = $plan[i];
        if (part.type === 'user') {
            return part.id;
        }
    }
    return null;
}

export function regenerateOnUserMessage(id: string) {
    if (get(generating)) return;
    deleteAfterUserMessage(id);
    socketEmit('send-message', { messages: getCleanedMessagesList() });
    generating.set(true);

    forceAutoScrollChat();
}

export function regenerateOnAssistantResponse(planIndex: number) {
    if (get(generating)) return;
    const userMessageId = getLastUserMessageBeforePlan(planIndex);
    if (!userMessageId) return;
    regenerateOnUserMessage(userMessageId);
}

export const serverError = writable<string | null>(null);

socketOn("error", (err: any) => {
    console.log("Server Error:", err);
    serverError.set(err);
    generating.set(false);
})
