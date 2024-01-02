<script lang="ts">
import { onMount } from 'svelte';
import {
    Socket,
    createDarkModeStore,
    Chat,
    type SerializedChat,
} from '$lib/core';
import { debounce, localStorageGet, localStorageSet } from '$lib/util';

let ChatComponent: any;

onMount(async () => {
    ChatComponent = (await import('./components/Chat.svelte')).default;
})

const PROD = true;

const BASE_URL = PROD ? '' : 'http://127.0.0.1:5004';

const socket = new Socket(BASE_URL, { transports: ['websocket'] });
socket.on("connect", () => console.log("CONNECTED"));

const darkMode = createDarkModeStore();
const chat = new Chat(socket);

const existingChat = localStorageGet<SerializedChat>('chat');
if (existingChat) {
    chat.setFromSerialized(existingChat);
}


const saveState = debounce(() => {
    setTimeout(() => {
        localStorageSet('chat', chat.serialize());
    })
}, 500);

chat.messages.subscribe(saveState);
chat.prompt.files.subscribe(saveState);
chat.prompt.images.subscribe(saveState);
chat.prompt.text.subscribe(saveState);
chat.errors.subscribe(saveState);
chat.config.subscribe(saveState);

</script>

<svelte:component this={ChatComponent} {chat}/>
