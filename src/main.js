import { createApp } from 'vue'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/noto-sans-tamil/500.css'
import '@fontsource/noto-sans-tamil/700.css'
import '@fontsource/noto-sans-devanagari/500.css'
import '@fontsource/noto-sans-devanagari/700.css'
import App from './App.vue'
import { polyfillCanvas } from './lib/polyfill.js'
import './styles/shell.css'

polyfillCanvas()
createApp(App).mount('#app')
