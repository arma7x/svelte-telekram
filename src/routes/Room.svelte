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

  let fetchForwardedUsers = [];
  const forwardedUsersIndex = [];
  const cachedForwardedUsers = {};

  let fetchForwardedChannels = [];
  const forwardedChannelsIndex = [];
  const cachedForwardedChannels = {};

  let chat: any;
  let name: string = 'Room';
  let messages: Array<any> = [];
  let messageMetadata: { [key: string]: { index: number, deleted: bool, callback: Function }; } = {};
  let replyIndex: { [key: string]: any; } = {};
  let muteUntil: number|bool = false;

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

      // Skip for channel, only group or private chat
      if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
        if (message.sender && message.sender.className === 'User' && cachedForwardedUsers[message.sender.id.value.toString()] == null) {
          cachedForwardedUsers[message.sender.id.value.toString()] = message.sender;
        } else if (message.sender && message.sender.className === 'Channel' && cachedForwardedChannels[message.sender.id.value.toString()] == null) {
          cachedForwardedChannels[message.sender.id.value.toString()] = message.sender;
        } else if (message.sender == null) {
          if (cachedForwardedUsers[message.senderId.value.toString()]) {
            // console.log('get sender from cachedForwardedUsers:', cachedForwardedUsers[message.senderId.value.toString()]);
            message.__sender = cachedForwardedUsers[message.senderId.value.toString()];
          } else if (cachedForwardedChannels[message.senderId.value.toString()]) {
            // console.log('get sender from cachedForwardedChannels:', cachedForwardedChannels[message.senderId.value.toString()]);
            message.__sender = cachedForwardedChannels[message.senderId.value.toString()];
          }
        }

        const sender = message.sender || message.__sender;
        if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
          if (sender && !(sender.username == null && sender.phone == null) && sender.photo != null) {
            message.iconRef = sender.photo.photoId.toString();
            httpTasks.push({
              url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${sender.phone === "42777" ? 'telegram' : sender.username}`,
              photoId: sender.photo.photoId.toString(),
              chat: sender
            });
          } else if (sender && sender.photo != null) {
            message.iconRef = sender.photo.photoId.toString();
            websocketTasks.push({
              photoId: sender.photo.photoId.toString(),
              chat: sender
            });
          }
        }
      }

      if (message.forward) {
        if (message.forward.originalFwd.fromName) {
          delete message.iconRef;
        } else if (message.forward.originalFwd.fromId) {
          delete message.iconRef;
          if (message.forward.originalFwd.fromId.className === 'PeerUser') {
            if (cachedForwardedUsers[message.forward.originalFwd.fromId.userId.toString()] == null) {
              fetchForwardedUsers.push(message.forward.originalFwd.fromId);
            }
            forwardedUsersIndex.push(index);
          } else if (message.forward.originalFwd.fromId.className === 'PeerChannel') {
            if (cachedForwardedChannels[message.forward.originalFwd.fromId.channelId.toString()] == null) {
              fetchForwardedChannels.push(message.forward.originalFwd.fromId);
            }
            forwardedChannelsIndex.push(index);
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

    const users = await client.invoke(new Api.users.GetUsers({ id: fetchForwardedUsers }));
    users.forEach(u => {
      cachedForwardedUsers[u.id.toString()] = u;
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
    forwardedUsersIndex.forEach(i => {
      messages[i].forward.originalFwd.sender = cachedForwardedUsers[messages[i].forward.originalFwd.fromId.userId.toString()];
      if (!(messages[i].forward.originalFwd.sender.username == null && messages[i].forward.originalFwd.sender.phone == null) && messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      } else if (messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      }
    });
    fetchForwardedUsers = [];

    const channels = await client.invoke(new Api.channels.GetChannels({ id: fetchForwardedChannels }));
    channels.chats.forEach(c => {
      cachedForwardedChannels[c.id.toString()] = c;
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
    forwardedChannelsIndex.forEach(i => {
      messages[i].forward.originalFwd.sender = cachedForwardedChannels[messages[i].forward.originalFwd.fromId.channelId.toString()];
      if (!(messages[i].forward.originalFwd.sender.username == null && messages[i].forward.originalFwd.sender.phone == null) && messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      } else if (messages[i].forward.originalFwd.sender.photo != null) {
        messages[i].iconRef = messages[i].forward.originalFwd.sender.photo.photoId.toString();
      }
    });
    fetchForwardedChannels = [];

    runTask(httpTasks, websocketTasks);
    return messages;
  }

  async function getMessages(entity) {
    try {
      const chats = await getChatCollection();
      chat = chats.find(chat => {
        return chat.entity.id.value == entity.id.value;
      });
      if (chat.dialog.notifySettings.muteUntil) {
        muteUntil = new Date(new Date().getTime() + chat.dialog.notifySettings.muteUntil);
      } else {
        muteUntil = false;
      }
      console.log('muteUntil:', muteUntil);
      const _messages = await client.getMessages(chat, { limit: 50 });
      _messages.reverse();
      messages = await buildIndex(_messages);
    } catch (err) {
      console.log(err);
    }
  }

  function registerCallButtonHandler(id, callback) {
    if (messageMetadata[id]) {
      messageMetadata[id].callback = callback;
    }
  }

  function keydownEventHandler(evt) {
    if (evt.key === 'Call' || evt.code === 'ShiftLeft') {
      if (messages[navInstance.verticalNavIndex] && messages[navInstance.verticalNavIndex].id.toString()) {
        if (messageMetadata[messages[navInstance.verticalNavIndex].id.toString()]) {
          const cb = messageMetadata[messages[navInstance.verticalNavIndex].id.toString()].callback;
          cb && cb();
        }
      }
    }
  }

  async function incomingMessageListener(evt) {
    // console.log('Listen:', location.state.entity.id.value.toString(), evt.className, evt);
    switch (evt.className) {
      case "UpdateNotifySettings":
        if (evt.notifySettings.muteUntil) {
          muteUntil = new Date(new Date().getTime() + evt.notifySettings.muteUntil);
        } else {
          muteUntil = false;
        }
        console.log('muteUntil:', muteUntil);
        break;
      case 'UpdateNewChannelMessage':
        var entities = Array.from(evt._entities.entries());
        for (let i in entities) {
          if (entities[i][1].id.toString() === location.state.entity.id.value.toString()) {
            // Skip for channel, only group or private chat
            if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
              if (!cachedForwardedUsers[evt.message.senderId.value.toString()]) {
                console.log('Api.users.GetUsers', evt.message.senderId.value.toString());
                // const users = await client.invoke(new Api.users.GetUsers({ id: [temp1.senderId] }));
              }
            }
            console.log(evt.message);
            const temp = [...messages, evt.message];
            messages = await buildIndex(temp);
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
          const pops = [];
          const temp = [];
          evt.messages.forEach(id => {
            if (messageMetadata[id.toString()]) {
              messageMetadata[id.toString()].deleted = true;
              pops.push(messageMetadata[id.toString()].index);
              delete messageMetadata[id.toString()];
              navInstance.navigateListNav(-1);
            }
          });
          for (let i in messages) {
            if (pops.indexOf(parseInt(i)) === -1) {
              temp.push(messages[i]);
            }
          }
          if (temp.length > 0) {
            messages = await buildIndex(temp);
            autoScroll();
          }
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
    if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup && location.state.entity.creator) {
      softwareKey.setText({ left: 'Action', center: 'BROADCAST', right: '📎' });
    } else if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup && !location.state.entity.creator) {
      softwareKey.setText({ left: '', center: 'UN/MUTED', right: '' });
    } else {
      softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
    }
    navInstance.attachListener();
    document.addEventListener('keydown', keydownEventHandler);
    client.addEventHandler(incomingMessageListener);
  });

  onDestroy(() => {
    navInstance.detachListener();
    document.removeEventListener('keydown', keydownEventHandler);
    client.removeEventHandler(incomingMessageListener);
  });

</script>

<main id="room-screen" data-pad-top="28" data-pad-bottom="30">
  {#each messages as message}
    {#if messageMetadata[message.id.toString()] && messageMetadata[message.id.toString()].deleted === false}
      <svelte:component className="roomNav" this={resolveMessageWidget(message)} {message} {registerCallButtonHandler} parentNavInstance={navInstance} replyTo={getReplyHeader(message)} entity={location.state.entity}/>
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
