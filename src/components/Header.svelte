<script lang="ts">
  let { onSettingsClick }: { onSettingsClick: () => void } = $props()
</script>

<header>
  <h1>Charcu<span>Time</span></h1>
  <button class="gear-btn" onclick={onSettingsClick} title="Preferences" aria-label="Preferences">
    ⚙
  </button>
</header>

<style>
  .gear-btn {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px 8px;
    border-radius: var(--radius);
    transition: color 0.2s;
    line-height: 1;
  }
  .gear-btn:hover {
    color: var(--text);
    background: none;
  }
</style>
