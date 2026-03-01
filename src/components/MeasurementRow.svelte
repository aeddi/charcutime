<script lang="ts">
  import { t, locale } from 'svelte-i18n'
  import type { Item, Measurement } from '../lib/types'
  import { lossPercent } from '../lib/logic'
  import { deleteMeasurement } from '../stores/data'
  import { prefs } from '../stores/data'
  import { formatWeight } from '../lib/units'

  let { item, measurement, index }: {
    item: Item
    measurement: Measurement
    index: number
  } = $props()

  const formattedDate = $derived(
    new Intl.DateTimeFormat($locale ?? 'en', { dateStyle: 'short' }).format(new Date(measurement.date + 'T12:00:00'))
  )
</script>

<div class="measurement-row">
  <span class="date">{formattedDate}</span>
  <span>
    {formatWeight(measurement.weight, $prefs.weightUnit)}
    ({lossPercent(item.initialWeight, measurement.weight).toFixed(1)}%)
  </span>
  <button class="delete-m" onclick={() => deleteMeasurement(item.id, index)} title={$t('itemCard.delete')}>×</button>
</div>
