<script lang="ts">
  import { onMount } from 'svelte'
  import { t, locale } from 'svelte-i18n'
  import Chart from 'chart.js/auto'
  import 'chartjs-adapter-date-fns'
  import { enUS, fr as frLocale, it as itLocale, es as esLocale, de as deLocale } from 'date-fns/locale'
  import type { Locale } from 'date-fns'
  import { appData, prefs } from '../stores/data'
  import { lossPercent, estimateCompletion } from '../lib/logic'
  import { formatWeight } from '../lib/units'
  import type { Item } from '../lib/types'

  const DATE_FNS_LOCALES: Record<string, Locale> = { en: enUS, fr: frLocale, it: itLocale, es: esLocale, de: deLocale }
  const dateFnsLocale = $derived(DATE_FNS_LOCALES[($locale ?? 'en').split('-')[0]] ?? enUS)

  let canvas: HTMLCanvasElement
  let chart: Chart | null = null

  function buildDatasets(items: Item[]) {
    const datasets: object[] = []

    for (const item of items) {
      const sorted = [...item.measurements].sort((a, b) => a.date.localeCompare(b.date))
      const points = [{ x: item.initialDate, y: 0 }]
      for (const m of sorted) {
        points.push({ x: m.date, y: lossPercent(item.initialWeight, m.weight) })
      }

      datasets.push({
        label: item.name,
        data: points,
        borderColor: item.color,
        backgroundColor: item.color + '33',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        fill: false,
        // @ts-expect-error custom property for tooltip lookup
        itemId: item.id,
      })

      const est = estimateCompletion(item)
      const maxDate = est && est.estDate > new Date()
        ? est.estDate.toISOString().slice(0, 10)
        : (sorted.length ? sorted[sorted.length - 1].date : item.initialDate)
      const targetEndDate = new Date(Math.max(
        new Date(maxDate).getTime(),
        Date.now() + 30 * 86400000
      )).toISOString().slice(0, 10)

      datasets.push({
        label: `${item.name} ${$t('chart.target')}`,
        data: [
          { x: item.initialDate, y: item.targetLossPercent },
          { x: targetEndDate, y: item.targetLossPercent },
        ],
        borderColor: item.color,
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      })

      if (est && est.reg.slope > 0 && sorted.length >= 1) {
        const lastPoint = points[points.length - 1]
        const projEndDate = est.estDate.toISOString().slice(0, 10)
        if (projEndDate > lastPoint.x) {
          datasets.push({
            label: `${item.name} ${$t('chart.projection')}`,
            data: [
              { x: lastPoint.x, y: lastPoint.y },
              { x: projEndDate, y: item.targetLossPercent },
            ],
            borderColor: item.color + '88',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: [0, 4],
            pointStyle: 'crossRot',
            fill: false,
          })
        }
      }
    }

    return datasets
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest' as const, intersect: false },
    scales: {
      x: {
        type: 'time' as const,
        adapters: { date: { locale: dateFnsLocale } },
        time: { unit: 'day' as const, tooltipFormat: 'PP' },
        title: { display: true, text: $t('chart.dateLabel'), color: '#999' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#999' },
      },
      y: {
        title: { display: true, text: $t('chart.lossLabel'), color: '#999' },
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#999', callback: (v: unknown) => v + '%' },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#ccc',
          filter: (legendItem: { text: string }) =>
            !legendItem.text.includes($t('chart.target')) && !legendItem.text.includes($t('chart.projection')),
        },
      },
      tooltip: {
        filter: (item: { dataIndex: number; dataset: { label: string } }) =>
          !(item.dataset.label.includes($t('chart.projection')) && item.dataIndex === 0),
        callbacks: {
          label: (context: { dataset: { label: string; itemId?: string }; parsed: { y: number } }) => {
            const ds = context.dataset
            if (ds.label.includes($t('chart.target'))) return `${ds.label}: ${context.parsed.y}%`
            if (ds.label.includes($t('chart.projection'))) return `${ds.label}: ${context.parsed.y.toFixed(1)}%`
            const found = $appData.items.find(i => i.id === ds.itemId)
            if (found) {
              const y = context.parsed.y
              const estWeight = found.initialWeight * (1 - y / 100)
              return `${found.name}: ${y.toFixed(1)}% ${$t('chart.loss')} (${formatWeight(estWeight, $prefs.weightUnit)})`
            }
            return `${ds.label}: ${context.parsed.y.toFixed(1)}%`
          },
        },
      },
    },
  }

  onMount(() => {
    chart = new Chart(canvas, {
      type: 'line',
      data: { datasets: buildDatasets($appData.items) },
      options: chartOptions,
    })
    return () => { chart?.destroy(); chart = null }
  })

  $effect(() => {
    if (!chart) return
    chart.data.datasets = buildDatasets($appData.items)
    // @ts-expect-error adapter options not in Chart.js types
    if (chart.options.scales?.x) chart.options.scales.x.adapters = { date: { locale: dateFnsLocale } }
    chart.update()
  })
</script>

<div class="chart-container">
  <canvas bind:this={canvas} style:display={$appData.items.length === 0 ? 'none' : 'block'}></canvas>
  {#if $appData.items.length === 0}
    <div class="empty-state">
      <div>{$t('chart.empty')}</div>
    </div>
  {/if}
</div>
