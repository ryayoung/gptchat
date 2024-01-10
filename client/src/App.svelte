<script lang="ts">
import { Socket, Chat } from './lib/core/index.svelte'
import * as util from './lib/util/index'

let ChatComponent: any = $state(null)

setTimeout(async () => {
    ChatComponent = (await import('./components/Chat.svelte')).default
})

const PROD = true

const BASE_URL = PROD ? '' : 'http://127.0.0.1:5004'

const socket = new Socket(BASE_URL, { transports: ['websocket'] })

let totalWidth = $state(window.innerWidth)
let totalHeight = $state(window.innerHeight)

window.addEventListener('resize', () => {
    totalWidth = window.innerWidth
    totalHeight = window.innerHeight
})

let darkMode = $state(util.checkDarkModePreferred())

$effect(() => util.changeHtmlClassList(darkMode ? 'add' : 'remove', 'dark'))

const chat = new Chat('chat', socket)
</script>

{#if ChatComponent}
    <ChatComponent {chat} {totalWidth} {totalHeight} />
{/if}
