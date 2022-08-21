<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let block: any = {};

  onMount(() => {
    console.log(block);
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
  margin: 0 0 5px 0;
  text-align: start;
}
</style>
