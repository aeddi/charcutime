<script lang="ts">
  import { t } from 'svelte-i18n'
  import { pendingConflict, resolveConflict } from '../stores/data'
</script>

{#if $pendingConflict}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="modal-overlay">
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="conflict-title" tabindex="-1" style="width:440px;">
      <h3 id="conflict-title">{$t('sync.conflictTitle')}</h3>
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:16px;">
        {$t('sync.conflictDesc')}
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:0.85rem;">
        <div style="background:var(--surface2);padding:10px;border-radius:var(--radius);">
          <div style="color:var(--text-muted);margin-bottom:4px;">{$t('sync.local')}</div>
          <div style="font-weight:600;">{$pendingConflict.local.items.length} {$t('sync.items')}</div>
        </div>
        <div style="background:var(--surface2);padding:10px;border-radius:var(--radius);">
          <div style="color:var(--text-muted);margin-bottom:4px;">{$t('sync.remote')}</div>
          <div style="font-weight:600;">{$pendingConflict.remote.items.length} {$t('sync.items')}</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="primary" onclick={() => resolveConflict('merge')}>
          {$t('sync.merge')}
        </button>
        <button onclick={() => resolveConflict('local')}>{$t('sync.keepLocal')}</button>
        <button onclick={() => resolveConflict('remote')}>{$t('sync.keepRemote')}</button>
      </div>
    </div>
  </div>
{/if}
