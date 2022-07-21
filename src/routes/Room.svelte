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

  const collectUsers = [];
  const collectUserIndex = [];
  const cachedUsers = {};

  const collectChannels = [];
  const collectChannelIndex = [];
  const cachedChannels = {};

  let chat: any;
  let name: string = 'Room';
  let messages: Array<any> = [];
  let messageMetadata: { [key: string]: { index: number, deleted: bool, callback: Function }; } = {};
  let replyIndex: { [key: string]: any; } = {};

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

  async function buildIndex(messages) {

    const httpTasks = [];
    const websocketTasks = [];
    const fetchReply = [];

    messages.forEach((message, index) => {
      if (messageMetadata[message.id.toString()] == null) {
        messageMetadata[message.id.toString()] = {}
      }
      messageMetadata[message.id.toString()].index = index;
      messageMetadata[message.id.toString()].deleted = false;

      if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
        if (message.sender && !(message.sender.username == null && message.sender.phone == null) && message.sender.photo != null) {
          message.iconRef = message.sender.photo.photoId.toString();
          httpTasks.push({
            url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${message.sender.phone === "42777" ? 'telegram' : message.sender.username}`,
            photoId: message.sender.photo.photoId.toString(),
            chat: message.sender
          });
        } else if (message.sender && message.sender.photo != null) {
          message.iconRef = message.sender.photo.photoId.toString();
          websocketTasks.push({
            photoId: message.sender.photo.photoId.toString(),
            chat: message.sender
          });
        }
      }

      if (message.forward) {
        if (message.forward.originalFwd.fromName) {
          delete message.iconRef;
        } else if (message.forward.originalFwd.fromId) {
          delete message.iconRef;
          if (message.forward.originalFwd.fromId.className === 'PeerUser') {
            if (cachedUsers[message.forward.originalFwd.fromId.userId.toString()] == null) {
              collectUsers.push(message.forward.originalFwd.fromId);
            }
            collectUserIndex.push(index);
          } else if (message.forward.originalFwd.fromId.className === 'PeerChannel') {
            if (cachedChannels[message.forward.originalFwd.fromId.channelId.toString()] == null) {
              collectChannels.push(message.forward.originalFwd.fromId);
            }
            collectChannelIndex.push(index);
          }
        }
      }

      if (message.replyTo) {
        if (messageMetadata[message.replyTo.replyToMsgId.toString()]) {
          replyIndex[message.replyTo.replyToMsgId.toString()] = messageMetadata[message.replyTo.replyToMsgId.toString()].index;
        } else {
          if (fetchReply.indexOf(message.replyTo.replyToMsgId) < 0)
            fetchReply.push(message.replyTo.replyToMsgId);
        }
      }

    });

    try {
      const messages = await client.getMessages(chat, {ids:fetchReply});
      fetchReply.forEach((id, index) => {
        replyIndex[id.toString()] = messages[index];
      });
    } catch (err) {
      console.log(err);
    }

    const users = await client.invoke(new Api.users.GetUsers({ id: collectUsers }));
    users.forEach(u => {
      cachedUsers[u.id.toString()] = u;
      if (!(u.username == null && u.phone == null) && u.photo != null) {
        httpTasks.push({
          url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${u.phone === "42777" ? 'telegram' : u.username}`,
          photoId: u.photo.photoId.toString(),
          chat: u
        })
      } else if (u.photo != null) {
        websocketTasks.push({
          photoId: u.photo.photoId.toString(),
          chat: u
        })
      }
    });
    collectUserIndex.forEach(i => {
      messages[i].forward.originalFwd.sender = cachedUsers[messages[i].forward.originalFwd.fromId.userId.toString()];
      if (!(messages[i].forward.originalFwd.sender.username == null && messages[i].forward.originalFwd.sender.phone == null) && messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      } else if (messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      }
    });

    const channels = await client.invoke(new Api.channels.GetChannels({ id: collectChannels }));
    channels.chats.forEach(c => {
      cachedChannels[c.id.toString()] = c;
      if (!(c.username == null && c.phone == null) && c.photo != null) {
        httpTasks.push({
          url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${c.phone === "42777" ? 'telegram' : c.username}`,
          photoId: c.photo.photoId.toString(),
          chat: c
        })
      } else if (c.photo != null) {
        websocketTasks.push({
          photoId: c.photo.photoId.toString(),
          chat: c
        })
      }
    });
    collectChannelIndex.forEach(i => {
      messages[i].forward.originalFwd.sender = cachedChannels[messages[i].forward.originalFwd.fromId.channelId.toString()];
      if (!(messages[i].forward.originalFwd.sender.username == null && messages[i].forward.originalFwd.sender.phone == null) && messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      } else if (messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      }
    });

    runTask(httpTasks, websocketTasks);
    return messages;
  }

  async function getMessages(entity) {
    try {
      const chats = await getChatCollection();
      chat = chats.find(chat => {
        return chat.entity.id.value == entity.id.value;
      });
      const _messages = await client.getMessages(chat, { limit: 50 });
      _messages.reverse();
      messages = await buildIndex(_messages);
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
              messages.splice(messageMetadata[id.toString()].index, 1);
              delete messageMetadata[id.toString()];
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

  function getReplyHeader(message) {
    if (message.replyTo == null)
      return false;
    if (replyIndex[message.replyTo.replyToMsgId] || replyIndex[message.replyTo.replyToMsgId] === 0) {
      if (typeof replyIndex[message.replyTo.replyToMsgId] === 'number')
        return messages[replyIndex[message.replyTo.replyToMsgId]];
      return replyIndex[message.replyTo.replyToMsgId];
    }
    return -1;
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(location.state.name || name);
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
      <svelte:component className="roomNav" this={resolveMessageWidget(message)} {message} {registerCallback} parentNavInstance={navInstance} replyTo={getReplyHeader(message)} entity={location.state.entity}/>
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
