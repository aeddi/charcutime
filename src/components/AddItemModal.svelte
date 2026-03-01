<script lang="ts">
  import { t } from 'svelte-i18n'
  import { appData, addItem, updateItem, prefs } from '../stores/data'
  import { toDisplayUnit, fromDisplayUnit } from '../lib/units'

  let { itemId = null, onClose }: {
    itemId?: string | null
    onClose: () => void
  } = $props()

  const item = itemId ? $appData.items.find(i => i.id === itemId) : null
  const weightUnit = $derived($prefs.weightUnit)
  const unitLabel = $derived(weightUnit === 'oz' ? 'oz' : 'g')

  let name = $state(item?.name ?? '')
  let weight = $state(item ? toDisplayUnit(item.initialWeight, $prefs.weightUnit).toString() : '')
  let date = $state(item?.initialDate ?? new Date().toISOString().slice(0, 10))
  let target = $state(item?.targetLossPercent?.toString() ?? '35')
  let error = $state('')

  function save() {
    const displayVal = parseFloat(weight)
    const t_ = parseFloat(target)
    if (!name.trim() || !displayVal || !date || !t_) {
      error = $t('modal.fillAll')
      return
    }
    const w = fromDisplayUnit(displayVal, weightUnit)
    if (itemId) {
      updateItem(itemId, { name: name.trim(), initialWeight: w, initialDate: date, targetLossPercent: t_ })
    } else {
      addItem({ name: name.trim(), initialWeight: w, initialDate: date, targetLossPercent: t_ })
    }
    onClose()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="modal-overlay" onclick={onClose}>
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <h3 id="modal-title">{itemId ? $t('modal.editTitle') : $t('modal.addTitle')}</h3>
    {#if error}
      <div style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">{error}</div>
    {/if}
    <div class="form-group">
      <label for="input-name">{$t('modal.name')}</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input id="input-name" type="text" bind:value={name} placeholder={$t('modal.namePlaceholder')} autofocus>
    </div>
    <div class="form-group">
      <label for="input-weight">{$t('modal.initialWeight')} ({unitLabel})</label>
      <input id="input-weight" type="number" bind:value={weight} min="1" step="any" placeholder="500">
    </div>
    <div class="form-group">
      <label for="input-date">{$t('modal.startDate')}</label>
      <input id="input-date" type="date" bind:value={date}>
    </div>
    <div class="form-group">
      <label for="input-target">{$t('modal.targetLoss')}</label>
      <input id="input-target" type="number" bind:value={target} min="1" max="90" step="any" placeholder="35">
    </div>
    <div class="modal-actions">
      <button onclick={onClose}>{$t('modal.cancel')}</button>
      <button class="primary" onclick={save}>{$t('modal.save')}</button>
    </div>
  </div>
</div>
