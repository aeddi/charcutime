<script lang="ts">
  import { t, locale } from 'svelte-i18n'
  import { prefs, updatePrefs, exportData, importDataFromFile, syncState, syncNow, logout } from '../stores/data'
  import { SUPPORTED_LOCALES, LOCALE_LABELS, resolveLocale, setupI18n } from '../i18n'
  import { version } from '../../package.json'

  let { onClose, onStartLogin }: { onClose: () => void; onStartLogin: (provider: 'github' | 'google') => void } = $props()

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

  const currentLocale = $derived($prefs.language ?? resolveLocale(null))
  const isSyncing = $derived($syncState.status === 'syncing')
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
      {#if $syncState.displayName}
        <div class="pref-row" style="margin-bottom:6px;">
          <span>{$t('sync.loggedInAs')}</span>
          <span style="font-weight:600;">{$syncState.displayName}</span>
        </div>
        <div class="pref-row" style="margin-bottom:12px;font-size:0.8rem;color:var(--text-muted);">
          <span>{$t('sync.lastSynced')}</span>
          <span>{$syncState.lastSynced ? new Date($syncState.lastSynced).toLocaleString() : $t('sync.never')}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button onclick={() => syncNow()} disabled={isSyncing}>
            {isSyncing ? $t('sync.syncing') : $t('sync.syncNow')}
          </button>
          <button onclick={() => syncNow({ forceDirection: 'upload' })} disabled={isSyncing}>{$t('sync.forceUpload')}</button>
          <button onclick={() => syncNow({ forceDirection: 'download' })} disabled={isSyncing}>{$t('sync.forceDownload')}</button>
          <button class="danger" onclick={logout}>{$t('sync.logout')}</button>
        </div>
        {#if $syncState.error}
          <p style="color:var(--accent);font-size:0.8rem;margin-top:8px;">{$syncState.error}</p>
        {/if}
      {:else}
        <button onclick={() => onStartLogin('github')}>{$t('sync.loginBtn')}</button>
        <button onclick={() => onStartLogin('google')}>{$t('sync.loginBtnGoogle')}</button>
      {/if}
    </div>

    <div class="pref-section">
      <h3>{$t('prefs.data')}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button onclick={exportData}>{$t('prefs.export')}</button>
        <button onclick={() => fileInput.click()}>{$t('prefs.import')}</button>
        <input bind:this={fileInput} type="file" accept=".json" style="display:none" onchange={handleImport}>
      </div>
    </div>

    <div style="margin-top:16px;text-align:center;font-size:0.75rem;color:var(--text-muted);">
      v{version}
    </div>
  </div>
</div>
