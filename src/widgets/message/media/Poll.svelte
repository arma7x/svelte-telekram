<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let message: any = {};

  onMount(() => {
    console.log('--------------------------------');
    console.log(message.media.poll.question, `quiz: ${message.media.poll.quiz}`, `multipleChoice: ${message.media.poll.multipleChoice}`, message.media.poll.answers);
    if (message.media.results) {
      console.log(message.media.results.results);
      if (message.media.results.solution)
        console.log(message.media.results.solution);
    }
  })

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <b>{message.media.poll.quiz ? 'Quiz' : 'Poll'}:</b>
  <p>{message.media.poll.question}</p>
  {#if message.media.results}
  <small><i>Status: {message.media.poll.quiz ? 'Answered' : 'Voted'}</i></small>
  {/if}
</div>

<style>
.media-container {
  text-align: start;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
}
.media-container > p {
  padding: 0px;
  margin: 2px 0px;
}
</style>
