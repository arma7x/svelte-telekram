<script lang="ts">
  import { navigate as goto } from "svelte-navigator";
  import { createKaiNavigator, KaiNavigator } from '../utils/navigation';
  import { onMount, onDestroy } from 'svelte';

  import { Api, client } from '../utils/bootstrap';

  import { getChatCollection, runTask } from '../stores/telegram';

  import { Dummy, MessageText, MessageActionChannelCreate, MessageActionChatEditPhoto } from '../widgets/message';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let name: string = 'Room';
  let messages: Array<any> = [];
  let messageMetadata: { [key: string]: { index: number, deleted: bool, keyEvent: typeof KaiNavigator }; } = {};

  let navOptions = {
    verticalNavClass: 'roomNav',
    softkeyLeftListener: function(evt) {
      if (messages[this.verticalNavIndex] && messages[this.verticalNavIndex].id.toString()) {
        if (messageMetadata[messages[this.verticalNavIndex].id.toString()]) {
          console.log('propagate softkeyLeftListener', messages[this.verticalNavIndex].id.toString());
          messageMetadata[messages[this.verticalNavIndex].id.toString()].keyEvent.softkeyLeftListener(evt);
        }
      }
    },
    softkeyRightListener: function(evt) {
      // send attachment + bot command
    },
    enterListener: function(evt) {
      // use TextAreaDialog
      // send msg or broadcast(channel && admin)
    },
    backspaceListener: function(evt) {
      evt.preventDefault();
      goto(-1);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  function resolveMessageWidget(m) {
    if (m.className === "MessageService") {
      switch (m.action.className) {
        case 'MessageActionChannelCreate':
          return MessageActionChannelCreate;
        case 'MessageActionChatEditPhoto':
          return MessageActionChatEditPhoto;
      }
      return Dummy;
    } else if (m.className === "Message") {
      return MessageText;
    }
    return Dummy;
  }

  function buildIndex(messages) {
    messages.forEach((message, index) => {
      // console.log('iconRef:', message.iconRef);
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
      const httpTasks = [];
      const websocketTasks = [];
      const _messages = await client.getMessages(target, { limit: 50 });
      messages = _messages.reverse();
      messages.forEach(message => {
        if (['group', 'user', 'bot'].indexOf(location.state.type) > -1) {
          if (!(message.sender.username == null && message.sender.phone == null) && message.sender.photo != null) {
            message.iconRef = message.sender.photo.photoId.toString();
            httpTasks.push({
              url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${message.sender.phone === "42777" ? 'telegram' : message.sender.username}`,
              photoId: message.sender.photo.photoId.toString(),
              chat: message.sender
            });
          } else if (message.sender.photo != null) {
            message.iconRef = message.sender.photo.photoId.toString();
            websocketTasks.push({
              photoId: message.sender.photo.photoId.toString(),
              chat: message.sender
            });
          }
        }
      });
      runTask(httpTasks, websocketTasks);
      buildIndex(messages);
    } catch (err) {
      console.log(err);
    }
  }

  function registerkeyEvent(id, instance: typeof KaiNavigator) {
    if (messageMetadata[id]) {
      messageMetadata[id].keyEvent = instance;
    }
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(location.state.name || name);
    console.log('Room:', location.state.type);
    getMessages(location.state.entity);
    if (['group', 'user', 'bot'].indexOf(location.state.type) > -1) {
      softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
    } else {
      softwareKey.setText({ left: 'Action', center: 'BROADCAST', right: '📎' });
    }
    navInstance.attachListener();
  });

  onDestroy(() => {
    navInstance.detachListener();
  });

</script>

<main id="room-screen" data-pad-top="28" data-pad-bottom="30">
  {#each messages as message}
    <svelte:component className="roomNav" type={location.state.type} this={resolveMessageWidget(message)} {message} {registerkeyEvent} parentNavInstance={navInstance}/>
  {/each}
</main>

<style>
  #room-screen {
    overflow: scroll;
    width: 100%;
  }
  :global(#room-screen > .roomNav) {
    background-color: #ffffff;
    color: #000000;
  }
  :global(#room-screen > .roomNav.focus) {
    background-color: transparent;
  }
</style>
