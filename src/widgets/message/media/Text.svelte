<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let message: any = {};

  onMount(() => {})

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <span style="color:#A20000;">Unsupported Media: Text</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
