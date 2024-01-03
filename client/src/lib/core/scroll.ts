import { tick } from 'svelte';
import { get } from 'svelte/store';
import * as util from '$lib/util';

export class AutoScroller {
    ghostDiv = util.writable<HTMLDivElement | null>(null)
    containerDiv = util.writable<HTMLDivElement | null>(null)
    autoEnabled = true
    lastScrollHeight = 0
    lastScrollTop = 0
    handleUserScrollDebounced = util.debounce(() => this.handleUserScroll(), 100)
    autoScrollThrottled = util.throttleIgnore(() => this.autoScroll(), 200)

    scroll(how: 'auto' | 'force') {
        how === 'force' ? this.forceScroll() : this.autoScrollThrottled();
    }

    handleUserScroll() {
        if (!this.containerDiv._) return;
        const { scrollHeight, scrollTop, clientHeight } = this.containerDiv._;

        if (scrollTop < this.lastScrollTop) {
            this.autoEnabled = false;
        } else if (scrollHeight - scrollTop <= clientHeight + 50) {
            this.autoEnabled = true;
        }
        this.lastScrollTop = scrollTop;
    }

    private scrollChat(onlyIfScrollChanged: boolean = false) {
        if (!this.containerDiv._) {
            return;
        }
        const { scrollHeight } = this.containerDiv._;
        if (onlyIfScrollChanged && scrollHeight === this.lastScrollHeight) {
            return;
        }
        this.ghostDiv._?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.lastScrollHeight = scrollHeight;
    }

    private autoScroll() {
        if (this.autoEnabled) {
            tick().then(() => this.scrollChat(true))
        }
    }

    private forceScroll() {
        tick().then(() => this.scrollChat())
        this.autoEnabled = true;
    }
}

export default AutoScroller;
