import './styles/base.scss';
import './styles/utility.scss';
import './styles/github.markdown.scss';
import './styles/github.hljs.scss';
import './styles/global.scss';

import App from './App.svelte'


const app = new App({
  target: document.getElementById('app')!,
})

export default app
