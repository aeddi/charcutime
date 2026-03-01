<script lang="ts">
  import { prefs, updatePrefs, exportData, importDataFromFile } from '../stores/data'

  let { onClose }: { onClose: () => void } = $props()

  let fileInput: HTMLInputElement

  async function handleImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      await importDataFromFile(file)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed')
    }
    fileInput.value = ''
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="pref-overlay" onclick={onClose}>
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
  <div class="pref-panel" role="dialog" aria-modal="true" aria-label="Preferences" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>Preferences</h2>
      <button onclick={onClose} style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);padding:4px;">✕</button>
    </div>

    <div class="pref-section">
      <h3>Units</h3>
      <div class="pref-row">
        <span>Weight unit</span>
        <select
          value={$prefs.weightUnit}
          onchange={(e) => updatePrefs({ weightUnit: (e.target as HTMLSelectElement).value as 'g' | 'oz' })}
        >
          <option value="g">Grams / kg</option>
          <option value="oz">Oz / lb</option>
        </select>
      </div>
      <div class="pref-row">
        <span>Date format</span>
        <select
          value={$prefs.dateFormat}
          onchange={(e) => updatePrefs({ dateFormat: (e.target as HTMLSelectElement).value as 'auto' | 'dmy' | 'mdy' })}
        >
          <option value="auto">Auto (from language)</option>
          <option value="dmy">DD/MM/YYYY</option>
          <option value="mdy">MM/DD/YYYY</option>
        </select>
      </div>
    </div>

    <div class="pref-section">
      <h3>Language</h3>
      <div class="pref-row">
        <span>Language</span>
        <span style="color:var(--text-muted);font-size:0.85rem;">Coming soon</span>
      </div>
    </div>

    <div class="pref-section">
      <h3>Sync</h3>
      <div class="pref-row">
        <span>GitHub Gist sync</span>
        <span style="color:var(--text-muted);font-size:0.85rem;">Coming soon</span>
      </div>
    </div>

    <div class="pref-section">
      <h3>Data</h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button onclick={exportData}>Export backup (JSON)</button>
        <button onclick={() => fileInput.click()}>Import backup (JSON)</button>
        <input bind:this={fileInput} type="file" accept=".json" style="display:none" onchange={handleImport}>
      </div>
    </div>
  </div>
</div>
