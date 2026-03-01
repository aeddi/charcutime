<script lang="ts">
  import Header from './components/Header.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import ChartView from './components/ChartView.svelte'
  import PreferencesPanel from './components/PreferencesPanel.svelte'
  import AddItemModal from './components/AddItemModal.svelte'

  let showPrefs = $state(false)
  let showAddModal = $state(false)
  let editingItemId = $state<string | null>(null)

  function openAdd() { editingItemId = null; showAddModal = true }
  function openEdit(id: string) { editingItemId = id; showAddModal = true }
  function closeModal() { showAddModal = false; editingItemId = null }
</script>

<svelte:window onkeydown={(e) => {
  if (e.key === 'Escape') { showAddModal = false; showPrefs = false }
}} />

<Header onSettingsClick={() => showPrefs = true} />

<div class="app">
  <Sidebar onAdd={openAdd} onEdit={openEdit} />
  <main class="main">
    <ChartView />
  </main>
</div>

{#if showPrefs}
  <PreferencesPanel onClose={() => showPrefs = false} />
{/if}

{#if showAddModal}
  <AddItemModal itemId={editingItemId} onClose={closeModal} />
{/if}
