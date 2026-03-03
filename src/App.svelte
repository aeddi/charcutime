<script lang="ts">
  import { t } from 'svelte-i18n'
  import Header from './components/Header.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import ChartView from './components/ChartView.svelte'
  import PreferencesPanel from './components/PreferencesPanel.svelte'
  import AddItemModal from './components/AddItemModal.svelte'
  import SyncConflictDialog from './components/SyncConflictDialog.svelte'
  import { startLogin } from './stores/data'

  let showPrefs = $state(false)
  let showAddModal = $state(false)
  let editingItemId = $state<string | null>(null)
  let activeTab = $state<'items' | 'chart'>('items')

  function openAdd() { editingItemId = null; showAddModal = true }
  function openEdit(id: string) { editingItemId = id; showAddModal = true }
  function closeModal() { showAddModal = false; editingItemId = null }
</script>

<svelte:window onkeydown={(e) => {
  if (e.key === 'Escape') { showAddModal = false; showPrefs = false }
}} />

<Header onSettingsClick={() => showPrefs = true} />

<div class="tab-bar">
  <button class:active={activeTab === 'items'} onclick={() => activeTab = 'items'}>
    {$t('tabs.items')}
  </button>
  <button class:active={activeTab === 'chart'} onclick={() => activeTab = 'chart'}>
    {$t('tabs.chart')}
  </button>
</div>

<div class="app" data-tab={activeTab}>
  <Sidebar onAdd={openAdd} onEdit={openEdit} />
  <main class="main">
    <ChartView />
  </main>
</div>

{#if showPrefs}
  <PreferencesPanel onClose={() => showPrefs = false} onStartLogin={startLogin} />
{/if}

{#if showAddModal}
  <AddItemModal itemId={editingItemId} onClose={closeModal} />
{/if}

<SyncConflictDialog />
