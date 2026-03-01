<script lang="ts">
  import { appData, addItem, updateItem } from '../stores/data'

  let { itemId = null, onClose }: {
    itemId?: string | null
    onClose: () => void
  } = $props()

  const item = itemId ? $appData.items.find(i => i.id === itemId) : null

  let name = $state(item?.name ?? '')
  let weight = $state(item?.initialWeight?.toString() ?? '')
  let date = $state(item?.initialDate ?? new Date().toISOString().slice(0, 10))
  let target = $state(item?.targetLossPercent?.toString() ?? '35')
  let error = $state('')

  function save() {
    const w = parseFloat(weight)
    const t = parseFloat(target)
    if (!name.trim() || !w || !date || !t) {
      error = 'Please fill in all fields.'
      return
    }
    if (itemId) {
      updateItem(itemId, { name: name.trim(), initialWeight: w, initialDate: date, targetLossPercent: t })
    } else {
      addItem({ name: name.trim(), initialWeight: w, initialDate: date, targetLossPercent: t })
    }
    onClose()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="modal-overlay" onclick={onClose}>
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_interactive_supports_focus -->
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1" onclick={(e) => e.stopPropagation()}>
    <h3 id="modal-title">{itemId ? 'Edit Item' : 'Add New Item'}</h3>
    {#if error}
      <div style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">{error}</div>
    {/if}
    <div class="form-group">
      <label for="input-name">Name</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input id="input-name" type="text" bind:value={name} placeholder="e.g. Saucisson sec" autofocus>
    </div>
    <div class="form-group">
      <label for="input-weight">Initial Weight (g)</label>
      <input id="input-weight" type="number" bind:value={weight} min="1" step="any" placeholder="500">
    </div>
    <div class="form-group">
      <label for="input-date">Start Date</label>
      <input id="input-date" type="date" bind:value={date}>
    </div>
    <div class="form-group">
      <label for="input-target">Target Weight Loss (%)</label>
      <input id="input-target" type="number" bind:value={target} min="1" max="90" step="any" placeholder="35">
    </div>
    <div class="modal-actions">
      <button onclick={onClose}>Cancel</button>
      <button class="primary" onclick={save}>Save</button>
    </div>
  </div>
</div>
