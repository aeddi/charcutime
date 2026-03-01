<script lang="ts">
  import { t } from 'svelte-i18n'
  import { appData } from '../stores/data'
  import ItemCard from './ItemCard.svelte'

  let { onAdd, onEdit }: {
    onAdd: () => void
    onEdit: (id: string) => void
  } = $props()

  let expandedId = $state<string | null>(null)

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id
  }
</script>

<aside class="sidebar">
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <h2>{$t('sidebar.items')}</h2>
    <button class="primary" onclick={onAdd}>{$t('sidebar.add')}</button>
  </div>

  <div>
    {#if $appData.items.length === 0}
      <div style="color:var(--text-muted);font-size:0.85rem;padding:12px 0;">
        {$t('sidebar.empty')}
      </div>
    {/if}
    {#each $appData.items as item (item.id)}
      <div style="margin-bottom:12px;">
        <ItemCard
          {item}
          expanded={expandedId === item.id}
          onToggle={() => toggleExpand(item.id)}
          {onEdit}
        />
      </div>
    {/each}
  </div>
</aside>
