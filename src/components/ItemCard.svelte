<script lang="ts">
  import { t, locale } from 'svelte-i18n'
  import type { Item } from '../lib/types'
  import { lossPercent, estimateCompletion } from '../lib/logic'
  import { addMeasurement, deleteItem, prefs } from '../stores/data'
  import { formatWeight, fromDisplayUnit } from '../lib/units'
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
      ? new Intl.DateTimeFormat($locale ?? 'en', { dateStyle: 'medium' }).format(est.estDate)
      : sorted.length < 1 ? $t('itemCard.needMeasurements') : $t('itemCard.notConverging')
  )
  const targetWeight = $derived((item.initialWeight * (1 - item.targetLossPercent / 100)).toFixed(0))
  const weightUnit = $derived($prefs.weightUnit)

  let newDate = $state(new Date().toISOString().slice(0, 10))
  let newWeight = $state('')

  function handleAdd() {
    const displayVal = parseFloat(newWeight)
    if (!newDate || !displayVal) return
    // Convert from display unit back to grams for storage
    const grams = fromDisplayUnit(displayVal, weightUnit)
    addMeasurement(item.id, { date: newDate, weight: grams })
    newWeight = ''
  }

  function handleDelete() {
    if (confirm($t('itemCard.deleteConfirm'))) {
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
    {formatWeight(item.initialWeight, weightUnit)} &rarr; &minus;{item.targetLossPercent}% ({formatWeight(Number(targetWeight), weightUnit)})
  </div>

  {#if expanded}
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div class="item-details" onclick={(e) => e.stopPropagation()}>
      <dl class="item-info">
        <dt>{$t('itemCard.initial')}</dt><dd>{formatWeight(item.initialWeight, weightUnit)}</dd>
        <dt>{$t('itemCard.current')}</dt><dd>{formatWeight(currentWeight, weightUnit)}</dd>
        <dt>{$t('itemCard.loss')}</dt><dd>{currentLoss}%</dd>
        <dt>{$t('itemCard.target')}</dt><dd>{item.targetLossPercent}% ({formatWeight(Number(targetWeight), weightUnit)})</dd>
        <dt>{$t('itemCard.start')}</dt><dd>{new Intl.DateTimeFormat($locale ?? 'en', { dateStyle: 'short' }).format(new Date(item.initialDate + 'T12:00:00'))}</dd>
        <dt>{$t('itemCard.estDone')}</dt><dd>{estText}</dd>
      </dl>

      <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">{$t('itemCard.measurements')}</div>
      <div class="measurements-list">
        {#each sorted as m, i (m.date + m.weight)}
          <MeasurementRow {item} measurement={m} index={i} />
        {/each}
        {#if sorted.length === 0}
          <div style="font-size:0.8rem;color:var(--text-muted);padding:4px 0;">{$t('itemCard.noMeasurements')}</div>
        {/if}
      </div>

      <div class="add-measurement-form">
        <input type="date" bind:value={newDate}>
        <input type="number" bind:value={newWeight} placeholder="{$t('itemCard.weightPlaceholder')} ({weightUnit})" min="0.1" step="any" style="width:110px;">
        <button onclick={handleAdd}>{$t('itemCard.addBtn')}</button>
      </div>

      <div style="display:flex;gap:6px;margin-top:4px;">
        <button onclick={() => onEdit(item.id)} style="flex:1;">{$t('itemCard.edit')}</button>
        <button class="danger" onclick={handleDelete} style="flex:1;">{$t('itemCard.delete')}</button>
      </div>
    </div>
  {/if}
</div>
