import { noop } from './utils'

export function safe_not_equal(a: any, b: any) {
    return a !== a ? b === b : a !== b || (a && typeof a === 'object') || typeof a === 'function'
}

const subscriber_queue: any[] = []

/** Cleanup logic callback. */
export type Invalidator<T> = (value?: T) => void

/** Pair of subscriber and invalidator. */
export type SubscribeInvalidateTuple<T> = [Subscriber<T>, Invalidator<T>]

/** Callback to inform of a value updates. */
export type Subscriber<T> = (value: T) => void

/** Unsubscribes from value updates. */
export type Unsubscriber = () => void

/** Callback to update a value. */
export type Updater<T> = (value: T) => T

/**
 * Start and stop notification callbacks.
 * This function is called when the first subscriber subscribes.
 */
export type StartStopNotifier<T> = (set: (value: T) => void, update: (fn: Updater<T>) => void) => void | (() => void)

/** Writable interface for both updating and subscribing. */
export interface Writable<T> {
    /** Set value and inform subscribers. */
    get(): T
    set(this: void, value: T): void
    /** Update value using callback and inform subscribers. */
    update(this: void, updater: Updater<T>): void
    subscribe(this: void, run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber
}

export function writable<T>(value: T, start: StartStopNotifier<T> = noop): Writable<T> {
    let stop: Unsubscriber | null

    const subscribers: Set<SubscribeInvalidateTuple<T>> = new Set()

    function set(new_value: T): void {
        if (safe_not_equal(value, new_value)) {
            value = new_value
            if (stop) {
                // store is ready
                const run_queue = !subscriber_queue.length
                for (const subscriber of subscribers) {
                    subscriber[1]()
                    subscriber_queue.push(subscriber, value)
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1])
                    }
                    subscriber_queue.length = 0
                }
            }
        }
    }

    function update(fn: Updater<T>): void {
        set(fn(value))
    }

    function subscribe(run: Subscriber<T>, invalidate: Invalidator<T> = noop): Unsubscriber {
        const subscriber: SubscribeInvalidateTuple<T> = [run, invalidate]
        subscribers.add(subscriber)

        if (subscribers.size === 1) {
            stop = start(set, update) || noop
        }

        run(value)
        return () => {
            subscribers.delete(subscriber)
            if (subscribers.size === 0 && stop) {
                stop()
                stop = null
            }
        }
    }

    function get() {
        return value
    }

    return { get, set, update, subscribe }
}
