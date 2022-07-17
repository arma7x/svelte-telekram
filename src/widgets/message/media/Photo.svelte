<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let message: any = {}; //.media.photo or .media.document

  onMount(() => {})

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <span style="color:#A20000;">Unsupported Media: Photo</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
