import * as util from '../util'
import type { PartialMessageAnyRole } from './message'

type PromptConfig = {
    placeholder: string
    allow_upload: boolean
}

export type SerializedConfigStore = {
    functions: RecordOf<FunctionConfig>
    agent_name: string
    default_messages: PartialMessageAnyRole[]
    prompt: PromptConfig
    logo_small?: string
}

const defaultConfig: SerializedConfigStore = {
    functions: {},
    agent_name: 'Assistant',
    default_messages: [],
    prompt: {
        allow_upload: true,
        placeholder: 'Send a message...',
    },
    logo_small: undefined
}

export type FunctionResultType = 'text' | 'markdown' | 'html' | 'plotly' | string

export type FunctionConfig = {
    header?: {
        text?: string
        show?: boolean
    }
    arguments?: {
        show_key_as_code?: {
            key: string
            language: string
        }
        title?: string
    }
    result?: {
        title?: string
        type?: FunctionResultType
    }
}

type ProcessorFunctions = {
    [K in keyof SerializedConfigStore]: (input: SerializedConfigStore[K] | undefined) => SerializedConfigStore[K]
}

function process<T extends keyof SerializedConfigStore>(
    name: T,
    config: SerializedConfigStore[T] | undefined
): SerializedConfigStore[T] {
    return configProcessors[name](config)
}

const configProcessors: ProcessorFunctions = {
    logo_small(input) {
        if (typeof input === 'string') {
            return input
        }
    },

    default_messages(input) {
        return input ?? []
    },

    agent_name(input) {
        return input ?? defaultConfig.agent_name
    },

    prompt(input) {
        return {
            allow_upload: input?.allow_upload ?? defaultConfig.prompt.allow_upload,
            placeholder: input?.placeholder ?? defaultConfig.prompt.placeholder,
        }
    },

    functions(input) {
        if (!input) return {}
        return Object.entries(input).reduce((acc, [name, conf]) => {
            const res: FunctionConfig = {}
            const { header, result, arguments: args } = conf
            if (header) {
                res.header = {
                    text: header.text,
                    show: header.show,
                }
            }
            if (args) {
                res.arguments = {}
                if (args.show_key_as_code?.key && args.show_key_as_code?.language) {
                    res.arguments.show_key_as_code = args.show_key_as_code
                }
                if (args.title) {
                    res.arguments.title = args.title
                }
            }
            if (result) {
                res.result = {
                    title: result.title,
                    type: result.type,
                }
            }
            acc[name] = res
            return acc
        }, {} as RecordOf<FunctionConfig>)
    },
}

export type ConfigStore = util.Writable<SerializedConfigStore> & {
    setAll(config: Partial<SerializedConfigStore>): void
}

export function createConfigStore() {
    const obj: ConfigStore = {
        ...util.writable({ ...defaultConfig }),
        setAll(config) {
            this.update((s) => {
                for (const key in configProcessors) {
                    const k = key as keyof SerializedConfigStore
                    s[k] = process(k, config[k]) as any
                }
                return s
            })
        },
    }
    return obj
}

export default createConfigStore
