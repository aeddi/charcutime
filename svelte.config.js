import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// These codes are suppressed because they fire on intentional patterns
// (modal backdrops with onclick-to-close, stopPropagation on content divs).
const SUPPRESSED_WARNINGS = new Set([
  'a11y_click_events_have_key_events',
  'a11y_no_static_element_interactions',
  'a11y_interactive_supports_focus',
  'state_referenced_locally',
])

export default {
  preprocess: vitePreprocess(),
  onwarn(warning, handler) {
    if (SUPPRESSED_WARNINGS.has(warning.code)) return
    handler(warning)
  },
}
