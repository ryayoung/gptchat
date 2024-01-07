import { tick } from 'svelte';
import * as util from '../util';

export class AutoScroller {
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
        const div = this.containerDiv.get();
        if (!div) return;
        const { scrollHeight, scrollTop, clientHeight } = div;

        if (scrollTop < this.lastScrollTop) {
            this.autoEnabled = false;
        } else if (scrollHeight - scrollTop <= clientHeight + 50) {
            this.autoEnabled = true;
        }
        this.lastScrollTop = scrollTop;
    }

    private scrollChat(onlyIfScrollChanged: boolean = false) {
        const div = this.containerDiv.get();
        if (!div) {
            return;
        }
        const { scrollHeight } = div;
        if (onlyIfScrollChanged && scrollHeight === this.lastScrollHeight) {
            return;
        }
        div.scrollTo({ top: scrollHeight, behavior: 'smooth' })
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
