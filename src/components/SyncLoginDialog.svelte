<script lang="ts">
  import { t } from 'svelte-i18n'
  import { deviceFlowState, syncState } from '../stores/data'

  let { onCancel }: { onCancel: () => void } = $props()

  function copyCode() {
    if ($deviceFlowState?.userCode) {
      navigator.clipboard.writeText($deviceFlowState.userCode)
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="modal-overlay" onclick={onCancel}>
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="login-title" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <h3 id="login-title">{$t('sync.loginTitle')}</h3>

    {#if $syncState.status === 'polling' && $deviceFlowState}
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:16px;">
        {$t('sync.loginInstructions')}
      </p>

      <div style="background:var(--surface2);border-radius:var(--radius);padding:16px;text-align:center;margin-bottom:16px;">
        <div style="font-size:2rem;font-weight:700;letter-spacing:0.2em;font-family:monospace;">
          {$deviceFlowState.userCode}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <a
          href={$deviceFlowState.verificationUri}
          target="_blank"
          rel="noopener noreferrer"
          class="btn-link"
        >
          {$t('sync.openGitHub')} ↗
        </a>
        <button onclick={copyCode}>{$t('sync.copyCode')}</button>
        <button onclick={onCancel}>{$t('sync.cancel')}</button>
      </div>

      <p style="font-size:0.8rem;color:var(--text-muted);margin-top:12px;text-align:center;">
        {$t('sync.waitingForAuth')}
      </p>
    {:else}
      <p style="font-size:0.9rem;color:var(--text-muted);">{$t('sync.starting')}</p>
    {/if}

    {#if $syncState.error}
      <p style="color:var(--accent);font-size:0.85rem;margin-top:8px;">{$syncState.error}</p>
    {/if}
  </div>
</div>

<style>
  .btn-link {
    display: block;
    text-align: center;
    background: var(--accent);
    color: var(--text);
    border: none;
    padding: 8px 14px;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.85rem;
    text-decoration: none;
    transition: background 0.2s;
  }
  .btn-link:hover { background: #c73a52; }
</style>
