<script lang="ts">
  export let title: string = 'Svelte';

  let visible: bool = true;

  export function setTitleText(text) {
    title = text;
  }

  export function toggleVisibility() {
    visible = !visible;
    return visible;
  }

  export function getVisibility() {
    return visible;
  }

</script>

<div class="kai-app-bar" style="display:{visible ? '' : 'none'};">{title}</div>

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
