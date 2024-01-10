import { createRoot } from 'svelte'
import './styles/base.scss'
import './styles/utility.scss'
import './styles/github.markdown.scss'
import './styles/github.hljs.scss'
import './styles/global.scss'

import App from './App.svelte'

globalThis.log = (...data: any[]) => console.log(...data)

const app = createRoot(App, {
    target: document.getElementById('app')!,
})

export default app
