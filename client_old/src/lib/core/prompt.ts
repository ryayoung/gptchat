import * as util from '../util';
import type { ImageContentPart, TextContentPart } from './openai';
import type { ContentPart } from './message';

export type BinaryContentPart = {
    type: 'binary'
    name: string
    fileType: string
    content: ArrayBuffer
}

export type FileContentPart = BinaryContentPart | ImageContentPart

export type FilePartTypeMapping = {
    binary: BinaryContentPart
    image_url: ImageContentPart
}

type FileHandlers = {
    [K in keyof FilePartTypeMapping]: (file: File) => Promise<FilePartTypeMapping[K]>
}

const fileHandlers: FileHandlers = {
    async binary(file) {
        const content = await util.readFile(file, 'ArrayBuffer');
        return {
            type: 'binary',
            name: file.name,
            fileType: file.type,
            content,
        }
    },
    async image_url(file) {
        const url = await util.readFile(file, 'DataURL');
        return {
            type: 'image_url',
            image_url: { url },
        }
    },
}

function getFileType(file: File): keyof FilePartTypeMapping {
    return file.type.startsWith('image') ? 'image_url' : 'binary';
}

export type SerializedPrompt = {
    text: string
    images: ImageContentPart[]
    files: BinaryContentPart[]
}

export class Prompt {
    text = util.writable<string>('')
    images = util.writable<ImageContentPart[]>([]);
    files = util.writable<BinaryContentPart[]>([]);

    serialize(): SerializedPrompt {
        return {
            text: this.text._,
            images: this.images._,
            files: this.files._,
        }
    }

    set(props: SerializedPrompt) {
        this.text.set(props.text);
        this.images.set(props.images);
        this.files.set(props.files);
    }

    clear() {
        this.text.set('');
        this.files.set([]);
        this.images.set([]);
    }

    textContentPart(): TextContentPart {
        return { type: 'text', text: this.text._ }
    }

    isEmpty(): boolean {
        return (
            this.text._.trim() === ''
            && this.files._.length === 0
            && this.images._.length === 0
        )
    }

    removeImage(index: number) {
        this.images.update(store => {
            store.splice(index, 1)
            return store;
        })
    }
    removeFile(index: number) {
        this.files.update(store => {
            store.splice(index, 1)
            return store;
        })
    }

    addImage(image: ImageContentPart) {
        this.images.update(store => {
            store.push(image);
            return store;
        })
    }

    addFile(file: BinaryContentPart) {
        this.files.update(store => {
            store.push(file)
            return store;
        })
    }

    textIsEmpty(): boolean {
        return this.text._.trim() === ''
    }

    async upload() {
        util.getFileUpload(async (file) => {
            if (!file) {
                return
            }

            const type = getFileType(file);
            let fileUpload: FileContentPart;

            try {
                fileUpload = await fileHandlers[type](file);
            } catch (err) {
                return;
            }

            if (!fileUpload) {
                return;
            }

            if (fileUpload.type === 'image_url') {
                this.addImage(fileUpload);
            } else {
                this.addFile(fileUpload);
            }
        })
    }

    getContentParts(): ContentPart[] {
        let result: ContentPart[] = [...this.files._, ...this.images._];
        if (!this.textIsEmpty()) {
            result.push(this.textContentPart())
        }
        return result;
    }
}

export default Prompt;
