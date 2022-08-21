<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import DOMPurify from 'dompurify';
  import { resolveTextWidget } from '../common';

  export let block: any = {};

  onMount(() => {

  })

  onDestroy(() => {

  })

</script>

<svelte:options accessors immutable={true}/>

<p class="block-container">
  {@html DOMPurify.sanitize(resolveTextWidget(block.text))}
</p>

<style>
.block-container {
  margin: 0 0 5px 0;
  text-align: start;
}
</style>
