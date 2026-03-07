<script lang="ts">
  import { t } from 'svelte-i18n'

  let { onSettingsClick }: { onSettingsClick: () => void } = $props()
</script>

<header>
  <h1><img src="{import.meta.env.BASE_URL}icon.svg" alt="" class="logo" aria-hidden="true" />Charcu<span>Time</span></h1>
  <button class="gear-btn" onclick={onSettingsClick} title={$t('header.preferences')} aria-label={$t('header.preferences')}>
    <img src="{import.meta.env.BASE_URL}gear.svg" alt="" aria-hidden="true" class="gear-icon" />
  </button>
</header>

<style>
  h1 {
    display: flex;
    align-items: center;
  }
  .logo {
    height: 1.6em;
    width: 1.6em;
    margin-right: 0.4em;
  }
  .gear-btn {
    background: none;
    border: none;
    font-size: 2.6rem;
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
  .gear-icon {
    width: 1.6rem;
    height: 1.6rem;
    display: block;
  }
</style>
