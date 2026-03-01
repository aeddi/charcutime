<script lang="ts">
  import type { Item, Measurement } from '../lib/types'
  import { lossPercent } from '../lib/logic'
  import { deleteMeasurement } from '../stores/data'

  let { item, measurement, index }: {
    item: Item
    measurement: Measurement
    index: number
  } = $props()
</script>

<div class="measurement-row">
  <span class="date">{measurement.date}</span>
  <span>{measurement.weight}g ({lossPercent(item.initialWeight, measurement.weight).toFixed(1)}%)</span>
  <button class="delete-m" onclick={() => deleteMeasurement(item.id, index)} title="Delete">×</button>
</div>
