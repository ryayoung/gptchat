import * as util from '../util';

export type ConfigTypes = {
    functions: {
        validated: RecordOf<FunctionConfig>
        input: RecordOf<FunctionInputConfig>
    },
    agent: {
        validated: AgentConfig
        input: AgentConfigInput
    }
};

export type AgentConfig = {
    name?: string
}
export type AgentConfigInput = {
    name?: string
}

export type SerializedConfigStore = {
    functions: ConfigTypes['functions']['validated']
    agent: ConfigTypes['agent']['validated']
}

export type ConfigInput = {
    functions?: ConfigTypes['functions']['input']
    agent?: ConfigTypes['agent']['input']
}

export type FunctionResultType = 'text' | 'markdown' | 'html' | string;

export type FunctionConfig = {
    header?: {
        text?: string
        show?: boolean
    },
    arguments?: {
        show_key_as_code?: {
            key: string
            language: string
        },
        title?: string
    },
    result?: {
        title?: string
        type?: FunctionResultType
    }
}
export type FunctionInputConfig = {
    header?: {
        text?: string
        show?: boolean
    },
    arguments?: {
        show_key_as_code?: {
            key: string
            language: string
        },
        title?: string
    },
    result?: {
        title?: string
        type?: FunctionResultType
    }
}

type ProcessorFunctions = {
    [K in keyof ConfigTypes]: (input: ConfigTypes[K]['input'] | undefined) => ConfigTypes[K]['validated'];
};

function process<T extends keyof ConfigTypes>(name: T, config: ConfigTypes[T]['input'] | undefined): ConfigTypes[T]['validated'] {
    return configProcessors[name](config);
}

const configProcessors: ProcessorFunctions = {

    agent(input) {
        if (!input) {
            return {};
        }
        return {
            name: input.name,
        }
    },

    functions(input) {
        if (!input) {
            return {};
        }
        return Object.entries(input).reduce((acc, [name, conf]) => {
            const res: FunctionConfig = {};
            const { header, result, arguments: args } = conf;
            if (header) {
                res.header = {
                    text: header.text,
                    show: header.show,
                };
            }
            if (args) {
                res.arguments = {};
                if (args.show_key_as_code?.key && args.show_key_as_code?.language) {
                    res.arguments.show_key_as_code = args.show_key_as_code;
                }
                if (args.title) {
                    res.arguments.title = args.title;
                }
            }
            if (result) {
                res.result = {
                    title: result.title,
                    type: result.type,
                };
            }
            acc[name] = res;
            return acc;
        }, {} as RecordOf<FunctionConfig>);
    },
};

const defaultConfig: SerializedConfigStore = {
    functions: {},
    agent: {},
}


export type ConfigStore = util.Writable<SerializedConfigStore> & {
    setAll(config: ConfigInput): void
}


export function createConfigStore() {
    const obj: ConfigStore = {
        ...util.writable({ ...defaultConfig }),
        setAll(config) {
            this.update(s => {
                for (const key in configProcessors) {
                    const k = key as keyof SerializedConfigStore;
                    s[k] = process(k, config[k]);
                }
                return s
            })
        },
    }
    obj.set({ ...defaultConfig });
    return obj;
}


export default createConfigStore;
