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
  <h3>{block.text.text}</h3>
</div>

<style>
.block-container {
  margin: 0 0 5px 0;
  text-align: start;
}
.block-container > h3 {
  margin-top: 0px;
  padding-top: 0px;
}
</style>
