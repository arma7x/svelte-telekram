<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let block: any = {};

  onMount(() => {

  })

  onDestroy(() => {

  })

</script>

<svelte:options accessors immutable={true}/>

<div class="block-container">
  <span style="color:#A20000;">WIP: {block.className}</span>
</div>

<style>
.block-container {
  text-align: start;
}
</style>
