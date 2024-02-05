import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
	plugins: [
		svelte({
			preprocess: sveltePreprocess({
				scss: {
					includePaths: ['src'],
				},
			}),
		}),
        viteCompression({
            verbose: true,
            algorithm: 'gzip',
            ext: '.gz',
        }),
        viteCompression({
            verbose: true,
            algorithm: 'brotliCompress',
            ext: '.br',
        }),
	],
	resolve: {
		alias: {
			'socket.io-client': 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js',
			'highlight.js':
				'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/highlight.min.js',
		},
	},
    build: {
        outDir: '../package/static',
        emptyOutDir: true,
        cssCodeSplit: false,
    }
});
