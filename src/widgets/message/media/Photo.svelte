<script lang="ts">
  export let message: any = {}; //.media.photo or .media.document
</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <span>MessageMediaDocumentPhoto</span>
</div>

<style>
.media-container {
  text-align: start;
}
</style>
