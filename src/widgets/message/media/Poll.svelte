<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { createKaiNavigator, KaiNavigator } from '../../../utils/navigation';
  import { OptionMenu, MultiSelector, SingleSelector } from '../../../components';

  import { client, Api } from '../../../utils/bootstrap';

  export let chat: any = {};
  export let message: any = {};
  export let parentNavInstance: typeof KaiNavigator;
  export let registerCallButtonHandler: Function = (id, callback) => {}
  export let refetchMessage: Function = (id: number) => {}

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
            onEnter: async (evt, scope) => {
              singleSelector.$destroy();
              let vote;
              for (let i in scope.options) {
                if (scope.options[i].selected) {
                  vote = message.media.poll.answers[i];
                  break;
                }
              }
              if (vote) {
                try {
                  const result = await client.invoke(new Api.messages.SendVote({
                    peer: chat,
                    msgId: message.id,
                    options: [vote.option]
                  }));
                  // console.log(message, result);
                  refetchMessage(message.id);
                } catch (err) {
                  console.log(err);
                }
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
            onSoftkeyRight: async (evt, scope) => {
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
                const options = votes.map(v => v.option);
                try {
                  const result = await client.invoke(new Api.messages.SendVote({
                    peer: chat,
                    msgId: message.id,
                    options: options
                  }));
                  // console.log(message, result);
                  refetchMessage(message.id);
                } catch (err) {
                  console.log(err);
                }
                // TODO: Submit votes
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
          title: 'Result',
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

  function update() {
    available = true;
    answeredOrVoted = false;
    if (message.media.poll.closed)
      available = false;
    for (let r in message.media.results.results) {
      if (message.media.results.results[r].chosen) {
        available = false;
        answeredOrVoted = true;
        break;
      }
    }
  }

  beforeUpdate(() => {
    update();
  })

  onMount(() => {
    registerCallButtonHandler(message.id.toString(), actionMenu);
    update();
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
