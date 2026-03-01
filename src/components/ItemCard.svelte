<script lang="ts">
  import type { Item } from '../lib/types'
  import { lossPercent, estimateCompletion } from '../lib/logic'
  import { addMeasurement, deleteItem } from '../stores/data'
  import MeasurementRow from './MeasurementRow.svelte'

  let { item, expanded, onToggle, onEdit }: {
    item: Item
    expanded: boolean
    onToggle: () => void
    onEdit: (id: string) => void
  } = $props()

  const sorted = $derived([...item.measurements].sort((a, b) => a.date.localeCompare(b.date)))
  const lastM = $derived(sorted.length ? sorted[sorted.length - 1] : null)
  const currentLoss = $derived(lastM ? lossPercent(item.initialWeight, lastM.weight).toFixed(1) : '0.0')
  const currentWeight = $derived(lastM ? lastM.weight : item.initialWeight)
  const est = $derived(estimateCompletion(item))
  const estText = $derived(
    est
      ? est.estDate.toLocaleDateString()
      : sorted.length < 1 ? 'Need measurements' : 'Not converging'
  )
  const targetWeight = $derived((item.initialWeight * (1 - item.targetLossPercent / 100)).toFixed(0))

  let newDate = $state(new Date().toISOString().slice(0, 10))
  let newWeight = $state('')

  function handleAdd() {
    const w = parseFloat(newWeight)
    if (!newDate || !w) return
    addMeasurement(item.id, { date: newDate, weight: w })
    newWeight = ''
  }

  function handleDelete() {
    if (confirm('Delete this item and all its measurements?')) {
      deleteItem(item.id)
    }
  }
</script>

<div
  class="item-card"
  class:expanded
  role="button"
  tabindex="0"
  onclick={onToggle}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle() }}
>
  <div class="item-header">
    <div class="color-dot" style="background:{item.color}"></div>
    <div class="item-name">{item.name}</div>
    <div style="font-size:0.8rem;color:var(--text-muted);">{currentLoss}%</div>
  </div>
  <div class="item-summary">
    {item.initialWeight}g &rarr; target &minus;{item.targetLossPercent}% ({targetWeight}g)
  </div>

  {#if expanded}
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div class="item-details" onclick={(e) => e.stopPropagation()}>
      <dl class="item-info">
        <dt>Initial</dt><dd>{item.initialWeight}g</dd>
        <dt>Current</dt><dd>{currentWeight}g</dd>
        <dt>Loss</dt><dd>{currentLoss}%</dd>
        <dt>Target</dt><dd>{item.targetLossPercent}% ({targetWeight}g)</dd>
        <dt>Start</dt><dd>{item.initialDate}</dd>
        <dt>Est. done</dt><dd>{estText}</dd>
      </dl>

      <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">Measurements</div>
      <div class="measurements-list">
        {#each sorted as m, i (m.date + m.weight)}
          <MeasurementRow {item} measurement={m} index={i} />
        {/each}
        {#if sorted.length === 0}
          <div style="font-size:0.8rem;color:var(--text-muted);padding:4px 0;">No measurements yet.</div>
        {/if}
      </div>

      <div class="add-measurement-form">
        <input type="date" bind:value={newDate}>
        <input type="number" bind:value={newWeight} placeholder="Weight (g)" min="1" step="any" style="width:100px;">
        <button onclick={handleAdd}>Add</button>
      </div>

      <div style="display:flex;gap:6px;margin-top:4px;">
        <button onclick={() => onEdit(item.id)} style="flex:1;">Edit</button>
        <button class="danger" onclick={handleDelete} style="flex:1;">Delete</button>
      </div>
    </div>
  {/if}
</div>
