type FileReadMethod = 'ArrayBuffer' | 'BinaryString' | 'Text' | 'DataURL'
type FileReadReturnTypeMap = {
    ArrayBuffer: ArrayBuffer
    BinaryString: string
    Text: string
    DataURL: string
}
export function readFile<T extends FileReadMethod>(file: File, as: T): Promise<FileReadReturnTypeMap[T]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e: ProgressEvent<FileReader>) => {
            const data = e.target?.result
            if (data !== null && data !== undefined) {
                resolve(data as FileReadReturnTypeMap[T])
            } else {
                reject(new Error('File read resulted in null data'))
            }
        }
        reader.onerror = (e: ProgressEvent<FileReader>) => {
            reject(new Error(`Error reading file: ${e.target?.error?.message || 'Unknown error'}`))
        }
        reader[`readAs${as}`](file)
    })
}

export function getFileUpload(callback: (file: File) => void, accept: string, multiple: false): void
export function getFileUpload(callback: (files: File[]) => void, accept: string, multiple: true): void
export function getFileUpload(callback: (file: File) => void, accept?: string, multiple?: boolean): void
export function getFileUpload(
    callback: ((file: File) => void) | ((files: File[]) => void),
    accept: string = '',
    multiple: boolean = false
): void {
    let input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple

    let fileSelected = false

    input.onchange = async (e) => {
        fileSelected = true
        const files = (e.target as HTMLInputElement).files
        if (files && files.length > 0) {
            return multiple
                ? (callback as (files: File[]) => void)(Array.from(files))
                : (callback as (file: File) => void)(files[0])
        }
    }
    input.click()
}

export function localStorageGet<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(key)
        return JSON.parse(item as string)
    } catch (e) {
        return null
    }
}

export function localStorageSet(key: string, value: any) {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
        console.error(e)
    }
}


export function sessionStorageGet<T>(key: string): T | null {
    try {
        const item = sessionStorage.getItem(key)
        return JSON.parse(item as string)
    } catch (e) {
        return null
    }
}

export function sessionStorageSet(key: string, value: any) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
        console.error(e)
    }
}
