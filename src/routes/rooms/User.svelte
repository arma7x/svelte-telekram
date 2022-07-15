<script lang="ts">
  import { navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../../utils/navigation';
  import { onMount, onDestroy } from 'svelte';

  import { Api, client } from '../../utils/bootstrap';

  import { getChatCollection } from '../../stores/telegram';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let name: string = 'User';
  let messages: Array<any> = [];
  let messageMetadata: { [key: string]: { index: number, deleted: bool}; } = {};

  let navOptions = {
    verticalNavClass: 'vertClass',
    softkeyLeftListener: function(evt) {},
    softkeyRightListener: function(evt) {},
    enterListener: function(evt) {},
    backspaceListener: function(evt) {
      evt.preventDefault();
      goto(-1);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function resolveMessageWidget(m) {
    if (m.className === "MessageService") {
      return `${m.id.toString()}: ${m.action.className}`;
    } else if (m.className === "Message") {
      if (m.message === "") {
        return `${m.id.toString()}: ${m.media.className}`;
      }
      return `${m.id.toString()}: ${m.message}`;
    }
    return `${m.id.toString()}: UNKNOWN`;
  }

  function buildIndex(messages) {
    messages.forEach((message, index) => {
      if (messageMetadata[message.id.toString()] == null) {
        messageMetadata[message.id.toString()] = {}
      }
      messageMetadata[message.id.toString()].index = index;
      messageMetadata[message.id.toString()].deleted = false;
    });
  }

  async function getMessages(entity) {
    try {
      const chats = await getChatCollection();
      const target = chats.find(chat => {
        return chat.entity.id.value == entity.id.value;
      });
      const _messages = await client.getMessages(target, { limit: 50 });
      messages = _messages.reverse();
      buildIndex(messages);
    } catch (err) {
      console.log(err);
    }
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(location.state.name || name);
    getMessages(location.state.entity);
    softwareKey.setText({ left: 'Menu', center: 'SEND', right: 'Attach' });
    navInstance.attachListener();
  });

  onDestroy(() => {
    navInstance.detachListener();
  });

</script>

<main id="room-screen" data-pad-top="28" data-pad-bottom="30">
  {#each messages as message}
    <div class="vertClass">{ resolveMessageWidget(message) }</div>
  {/each}
</main>

<style>
  #room-screen {
    overflow: scroll;
    width: 100%;
  }
  #room-screen > .vertClass {
    display:flex;
    flex-direction:column;
  }
  :global(#room-screen > .vertClass) {
    background-color: #ffffff;
    color: #000000;
  }
  :global(#room-screen > .vertClass.focus) {
    background-color: var(--themeColor)!important;
    color: #fff!important;
  }
</style>
