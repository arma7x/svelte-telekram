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
  let messageMetadata: { [key: string]: { index: number, deleted: bool, callback: Function }; } = {};

  let navOptions = {
    verticalNavClass: 'roomNav',
    softkeyLeftListener: function(evt) {
      // common action menu; reply, forward, report, delete, edit
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

  function registerCallback(id, callback) {
    if (messageMetadata[id]) {
      messageMetadata[id].callback = callback;
    }
  }

  function eventHandler(evt) {
    if (evt.key === 'Call' || evt.code === 'ShiftLeft') {
      if (messages[navInstance.verticalNavIndex] && messages[navInstance.verticalNavIndex].id.toString()) {
        if (messageMetadata[messages[navInstance.verticalNavIndex].id.toString()]) {
          const cb = messageMetadata[messages[navInstance.verticalNavIndex].id.toString()].callback;
          cb && cb();
        }
      }
    }
  }

  function eventListener(evt) {
    // console.log('Listen:', location.state.entity.id.value.toString(), evt.className, evt);
    switch (evt.className) {
      case 'UpdateNewChannelMessage':
        var entities = Array.from(evt._entities.entries());
        for (let i in entities) {
          if (entities[i][1].id.toString() === location.state.entity.id.value.toString()) {
            const temp = [...messages, evt.message];
            buildIndex(temp);
            messages = temp;
            autoScroll();
            break;
          }
        }
        break;
      case 'UpdateEditChannelMessage':
        var entities = Array.from(evt._entities.entries());
        for (let i in entities) {
          if (entities[i][1].id.toString() === location.state.entity.id.value.toString()) {
            if (messageMetadata[evt.message.id.toString()]) {
              const idx = messageMetadata[evt.message.id.toString()].index;
              messages[idx] = evt.message;
            }
            break;
          }
        }
        break;
      case 'UpdateDeleteChannelMessages':
        if (evt.channelId.toString() === location.state.entity.id.value.toString()) {
          evt.messages.forEach(id => {
            if (messageMetadata[id.toString()]) {
              messageMetadata[id.toString()].deleted = true;
              navInstance.navigateListNav(-1);
            }
          });
        }
        break;
    }
  }

  function autoScroll() {
    setTimeout(() => {
      if (messages.length - navInstance.verticalNavIndex === 2)
        navInstance.navigateListNav(1);
    }, 500);
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
    document.addEventListener('keydown', eventHandler);
    client.addEventHandler(eventListener);
  });

  onDestroy(() => {
    navInstance.detachListener();
    document.removeEventListener('keydown', eventHandler);
    client.removeEventHandler(eventListener);
  });

</script>

<main id="room-screen" data-pad-top="28" data-pad-bottom="30">
  {#each messages as message}
    {#if messageMetadata[message.id.toString()] && messageMetadata[message.id.toString()].deleted === false}
    <svelte:component className="roomNav" type={location.state.type} this={resolveMessageWidget(message)} {message} {registerCallback} parentNavInstance={navInstance}/>
    {/if}
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
