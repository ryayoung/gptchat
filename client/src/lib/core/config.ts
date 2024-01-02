import * as util from '$lib/util';

export type ConfigTypes = {
    functions: {
        validated: RecordOf<FunctionConfig>
        input: RecordOf<FunctionInputConfig>
    }
};

export type SerializedConfigStore = {
    functions: ConfigTypes['functions']['validated']
}

export type ConfigInput = {
    functions?: ConfigTypes['functions']['input']
}

export type FunctionResultType = 'text' | 'markdown';

export type FunctionConfig = {
    title?: string
    result_type?: FunctionResultType
}
export type FunctionInputConfig = {
    title?: string
    result_type?: string
}

type ProcessorFunctions = {
    [K in keyof ConfigTypes]: (input: ConfigTypes[K]['input'] | undefined) => ConfigTypes[K]['validated'];
};

function process<T extends keyof ConfigTypes>(name: T, config: ConfigTypes[T]['input'] | undefined): ConfigTypes[T]['validated'] {
    return configProcessors[name](config);
}

const configProcessors: ProcessorFunctions = {
    functions(input) {
        if (!input) {
            return {};
        }
        return Object.entries(input).reduce((acc, [name, conf]) => {
            const res: FunctionConfig = {};
            const { title, result_type } = conf;
            if (title) {
                res.title = title;
            }
            if (result_type === 'markdown' || result_type === 'text') {
                res.result_type = result_type;
            }
            acc[name] = res;
            return acc;
        }, {} as RecordOf<FunctionConfig>);
    },
};

const defaultConfig: SerializedConfigStore = {
    functions: {},
}


export type ConfigStore = util.Writable<SerializedConfigStore> & {
    setAll(config: ConfigInput): void
}


export function createConfigStore() {
    const obj: ConfigStore = {
        ...util.writable({ functions: {} }),
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
