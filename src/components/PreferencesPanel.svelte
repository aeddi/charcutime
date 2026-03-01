<script lang="ts">
  import { t, locale } from 'svelte-i18n'
  import { prefs, updatePrefs, exportData, importDataFromFile } from '../stores/data'
  import { SUPPORTED_LOCALES, LOCALE_LABELS, resolveLocale } from '../i18n'
  import { setupI18n } from '../i18n'

  let { onClose }: { onClose: () => void } = $props()

  let fileInput: HTMLInputElement

  function handleLocaleChange(e: Event) {
    const lang = (e.target as HTMLSelectElement).value
    updatePrefs({ language: lang })
    setupI18n(resolveLocale(lang))
  }

  async function handleImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      await importDataFromFile(file)
    } catch (err) {
      alert(err instanceof Error ? err.message : $t('prefs.importFailed'))
    }
    fileInput.value = ''
  }

  // Derive current locale for the selector (fallback to resolved from navigator)
  const currentLocale = $derived($prefs.language ?? resolveLocale(null))
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="pref-overlay" onclick={onClose}>
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
  <div class="pref-panel" role="dialog" aria-modal="true" aria-label={$t('prefs.title')} tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>{$t('prefs.title')}</h2>
      <button onclick={onClose} style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);padding:4px;">✕</button>
    </div>

    <div class="pref-section">
      <h3>{$t('prefs.language')}</h3>
      <div class="pref-row">
        <label for="pref-lang">{$t('prefs.language')}</label>
        <select id="pref-lang" value={currentLocale} onchange={handleLocaleChange}>
          {#each SUPPORTED_LOCALES as code}
            <option value={code}>{LOCALE_LABELS[code]}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="pref-section">
      <h3>{$t('prefs.units')}</h3>
      <div class="pref-row">
        <label for="pref-weight">{$t('prefs.weightUnit')}</label>
        <select
          id="pref-weight"
          value={$prefs.weightUnit}
          onchange={(e) => updatePrefs({ weightUnit: (e.target as HTMLSelectElement).value as 'g' | 'oz' })}
        >
          <option value="g">{$t('prefs.weightUnitG')}</option>
          <option value="oz">{$t('prefs.weightUnitOz')}</option>
        </select>
      </div>
      <div class="pref-row">
        <label for="pref-date">{$t('prefs.dateFormat')}</label>
        <select
          id="pref-date"
          value={$prefs.dateFormat}
          onchange={(e) => updatePrefs({ dateFormat: (e.target as HTMLSelectElement).value as 'auto' | 'dmy' | 'mdy' })}
        >
          <option value="auto">{$t('prefs.dateFormatAuto')}</option>
          <option value="dmy">{$t('prefs.dateFormatDmy')}</option>
          <option value="mdy">{$t('prefs.dateFormatMdy')}</option>
        </select>
      </div>
    </div>

    <div class="pref-section">
      <h3>{$t('prefs.sync')}</h3>
      <div class="pref-row">
        <span>GitHub Gist</span>
        <span style="color:var(--text-muted);font-size:0.85rem;">{$t('prefs.syncComingSoon')}</span>
      </div>
    </div>

    <div class="pref-section">
      <h3>{$t('prefs.data')}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button onclick={exportData}>{$t('prefs.export')}</button>
        <button onclick={() => fileInput.click()}>{$t('prefs.import')}</button>
        <input bind:this={fileInput} type="file" accept=".json" style="display:none" onchange={handleImport}>
      </div>
    </div>
  </div>
</div>
