<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let message: any = {};

  onMount(() => {})

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <span>! Not Support Sticker</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
