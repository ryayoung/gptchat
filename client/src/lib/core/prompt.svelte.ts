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
    text: string = $state('')
    images: ImageContentPart[] = $state([])
    files: BinaryContentPart[] = $state([])

    serialize(): SerializedPrompt {
        return {
            text: this.text,
            images: this.images,
            files: this.files,
        }
    }

    set(props: SerializedPrompt) {
        this.text = props.text
        this.images = props.images
        this.files = props.files
    }

    clear() {
        this.text = ''
        this.files = []
        this.images = []
    }

    textContentPart(): TextContentPart {
        return { type: 'text', text: this.text }
    }

    isEmpty(): boolean {
        return (
            this.text.trim() === ''
            && this.files.length === 0
            && this.images.length === 0
        )
    }

    removeImage(index: number) {
        this.images.splice(index, 1)
    }
    removeFile(index: number) {
        this.files.splice(index, 1)
    }

    addImage(image: ImageContentPart) {
        this.images.push(image)
    }

    addFile(file: BinaryContentPart) {
        this.files.push(file)
    }

    textIsEmpty(): boolean {
        return this.text.trim() === ''
    }

    upload() {
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
        let result: ContentPart[] = [...this.files, ...this.images];
        if (!this.textIsEmpty()) {
            result.push(this.textContentPart())
        }
        return result;
    }
}

export default Prompt;
