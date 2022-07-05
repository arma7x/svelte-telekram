<script lang="ts">
  export let title: string = 'Svelte';

  export function setTitleText(text) {
    title = text;
  }
</script>

<div class="kai-app-bar">{title}</div>

<style>
  .kai-app-bar {
    top: 26px;
    position: fixed;
    width: 100%;
    text-align: center;
    vertical-align: middle;
    line-height: 28px;
    height: 28px;
    padding: 0 4px;
    color: #ffffff;
    background-color: var(--themeColor);
    font-weight: normal;
    text-transform: uppercase;
  }
</style>
