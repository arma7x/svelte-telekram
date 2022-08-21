<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let block: any = {};

  onMount(() => {

  })

  onDestroy(() => {

  })

</script>

<svelte:options accessors immutable={true}/>

<div class="block-container"></div>

<style>
.block-container {
  width: 100%;
  border-top: 3px solid #bbb;
  margin: 0 0 5px 0;
  text-align: start;
}
</style>
