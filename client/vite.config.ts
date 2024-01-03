import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
    resolve: {
        alias: {
            'socket.io-client': 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js',
            'highlight.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/highlight.min.js',
        }
    }
});
