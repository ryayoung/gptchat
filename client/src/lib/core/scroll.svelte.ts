import { tick } from 'svelte'
import * as util from '../util'

export class AutoScroller {
    private elem: HTMLDivElement | null = null
    private autoScrollEnabled = true
    private lastScrollHeight = 0
    private lastScrollTop = 0

    action = (node: HTMLElement) => {
        this.elem = node as HTMLDivElement
        const scrollHandler = util.debounce(() => this.handleUserScrollEvent(), 100)
        this.elem.addEventListener('scroll', scrollHandler)
        tick().then(() => this.forceScroll())

        return {
            destroy: () => {
                this.elem?.removeEventListener('scroll', scrollHandler)
            }
        }
    }

    autoScroll = util.throttleIgnore(() => {
        if (this.autoScrollEnabled) {
            tick().then(() => {
                if (!this.elem) return
                const { scrollHeight } = this.elem
                if (scrollHeight !== this.lastScrollHeight) {
                    this.scrollTo(scrollHeight)
                }
            })
        }
    }, 200)

    forceScroll = () => {
        tick().then(() => {
            if (!this.elem) return
            this.scrollTo(this.elem.scrollHeight)
            this.autoScrollEnabled = true
        })
    }

    private scrollTo(top: number) {
        this.elem?.scrollTo({ top, behavior: 'smooth' })
        this.lastScrollHeight = top
    }

    private handleUserScrollEvent() {
        if (!this.elem) return
        const { scrollHeight, scrollTop, clientHeight } = this.elem

        if (scrollTop < this.lastScrollTop) {
            this.autoScrollEnabled = false
        } else if (scrollHeight - scrollTop <= clientHeight + 50) {
            this.autoScrollEnabled = true
        }
        this.lastScrollTop = scrollTop
    }
}

export default AutoScroller
