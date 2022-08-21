<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let block: any = {};

  function getPublishedDate() {
    return new Date(block.publishedDate * 1000).toString();
  }

  onMount(() => {
    console.log();
  })

  onDestroy(() => {

  })

</script>

<svelte:options accessors immutable={true}/>

<div class="block-container">
  <small>Publishe Date: {getPublishedDate()}</small>
</div>

<style>
.block-container {
  margin: 0 0 10px 0;
  text-align: start;
}
</style>
