export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    let timeout: ReturnType<typeof setTimeout> | null = null

    const debouncedFunction = function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
        const later = () => {
            timeout = null
            func.apply(this, args)
        }

        if (timeout !== null) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, delay)
    }

    debouncedFunction.cancel = function (): void {
        if (timeout !== null) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    return debouncedFunction as ((...args: Parameters<T>) => void) & { cancel: () => void }
}

export function throttleIgnore(func: (...args: Array<any>) => void, delay: number = 8) {
    let lastCall = 0
    return (...args: Array<any>) => {
        const now = new Date().getTime()
        if (now - lastCall >= delay) {
            lastCall = now
            func(...args)
        }
    }
}
