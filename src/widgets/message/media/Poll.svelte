<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';

  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallback: Function = (id, callback) => {}

  let available: bool = true;
  let answeredOrVoted: bool = false;

  function actionMenu() {
    // show media option menu
    // onOpened parentNavInstance.detachListener
    // onClosed parentNavInstance.attachListener
    console.log('Clicked:', message.id.toString());
  }

  onMount(() => {
    registerCallback(message.id.toString(), actionMenu);
    console.log('--------------------------------');
    console.log(message.media.poll.question, `quiz: ${message.media.poll.quiz}`, `multipleChoice: ${message.media.poll.multipleChoice}`, message.media.poll.answers);
    if (message.media.results.solution)
      console.log(message.media.results.solution);
    if (message.media.poll.closed)
      available = false;
    for (let r in message.media.results.results) {
      if (message.media.results.results[r].chosen) {
        available = false;
        answeredOrVoted = true;
        break;
      }
    }
  })

  onDestroy(() => {});

</script>

<svelte:options accessors immutable={true}/>
<div class="media-container">
  <b>{message.media.poll.quiz ? 'Quiz' : 'Poll'}:</b>
  <p>{message.media.poll.question}</p>
  {#if !available}
  <small><i>Status: {answeredOrVoted ? (message.media.poll.quiz ? 'Answered' : 'Voted') : 'Ended'}</i></small>
  {:else}
  <small><i>Status: Available</i></small>
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
