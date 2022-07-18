<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { OptionMenu, MultiSelector, SingleSelector } from '../../../components';

  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallback: Function = (id, callback) => {}

  let available: bool = true;
  let answeredOrVoted: bool = false;

  let optionMenu: OptionMenu;
  let singleSelector: SingleSelector;
  let multiSelector: MultiSelector;

  function actionMenu() {
    if (available) {
      const answers = [];
      message.media.poll.answers.forEach((answer) => {
        answers.push({ title: answer.text });
      });
      if (message.media.poll.quiz || !message.media.poll.multipleChoice) {
        singleSelector = new SingleSelector({
          target: document.body,
          props: {
            title: message.media.poll.quiz ? 'Pick your answer' : 'Cast your vote',
            focusIndex: 0,
            options: answers,
            softKeyCenterText: 'select',
            onSoftkeyRight: (evt, scope) => {},
            onSoftkeyLeft: (evt, scope) => {},
            onEnter: (evt, scope) => {
              singleSelector.$destroy();
              let vote;
              for (let i in scope.options) {
                if (scope.options[i].selected) {
                  vote = message.media.poll.answers[i];
                  break;
                }
              }
              if (vote) {
                console.log('Vote:', vote);
                // TODO: Submit vote
              } else {
                console.log('Empty vote');
              }
            },
            onBackspace: (evt, scope) => {
              evt.preventDefault();
              evt.stopPropagation();
              singleSelector.$destroy();
            },
            onOpened: () => {
              parentNavInstance.detachListener();
            },
            onClosed: (scope) => {
              parentNavInstance.attachListener();
              singleSelector = null;
            }
          }
        });
      } else {
        multiSelector = new MultiSelector({
          target: document.body,
          props: {
            title: 'Cast your votes',
            focusIndex: 0,
            options: answers,
            softKeyLeftText: 'Cancel',
            softKeyRightText: 'Done',
            softKeyCenterTextSelect: 'select',
            softKeyCenterTextDeselect: 'deselect',
            onSoftkeyLeft: (evt, scope) => {
              evt.preventDefault();
              evt.stopPropagation();
              multiSelector.$destroy();
            },
            onSoftkeyRight: (evt, scope) => {
              evt.preventDefault();
              evt.stopPropagation();
              multiSelector.$destroy();
              const votes = []
              scope.options.forEach((o, i) => {
                if (o.checked) {
                  votes.push(message.media.poll.answers[i])
                }
              });
              if (votes.length > 0) {
                console.log('Votes:', votes);
                // TODO: Submit votes
              } else {
                console.log('Empty votes');
              }
            },
            onBackspace: (evt, scope) => {
              evt.preventDefault();
              evt.stopPropagation();
              multiSelector.$destroy();
            },
            onOpened: () => {
              parentNavInstance.detachListener();
            },
            onClosed: (scope) => {
              parentNavInstance.attachListener();
              multiSelector = null;
            }
          }
        });
      }
    } else {
      const results = [];
      if (message.media.results.solution) {
        results.push({
          title: 'Explanation',
          subtitle: message.media.results.solution
        });
      }
      message.media.results.results.forEach((result, i) => {
        results.push({
          title: message.media.poll.answers[i].text,
          subtitle: `Voters: ${result.voters}, Chosen: ${result.chosen ? '√' : 'X'}${message.media.poll.quiz ? (result.correct ? ', Correct: √' : ', Correct: X') : ''}${message.media.poll.quiz ? (result.chosen && result.correct ? ', Result: √' : ', Result: X') : ''}`
        });
      });
      optionMenu = new OptionMenu({
        target: document.body,
        props: {
          title: `Total Voters: ${message.media.results.totalVoters}`,
          focusIndex: 0,
          options: results,
          softKeyCenterText: 'select',
          onSoftkeyRight: (evt, scope) => {},
          onSoftkeyLeft: (evt, scope) => {},
          onEnter: (evt, scope) => {
            optionMenu.$destroy();
          },
          onBackspace: (evt, scope) => {
            evt.preventDefault();
            evt.stopPropagation();
            optionMenu.$destroy();
          },
          onOpened: () => {
            parentNavInstance.detachListener();
          },
          onClosed: (scope) => {
            parentNavInstance.attachListener();
            optionMenu = null;
          }
        }
      });
    }
  }

  onMount(() => {
    registerCallback(message.id.toString(), actionMenu);
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
