import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { setupI18n, resolveLocale } from './i18n'
import { loadPrefs } from './lib/storage'

const prefs = loadPrefs()
setupI18n(resolveLocale(prefs.language))

mount(App, { target: document.getElementById('app')! })
