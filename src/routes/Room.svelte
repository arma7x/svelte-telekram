<script lang="ts">
  import { createKaiNavigator, KaiNavigator } from '../utils/navigation';
  import { onMount, onDestroy } from 'svelte';

  import { Api, client, cachedDatabase } from '../utils/bootstrap';

  import { retrieveChats, getChatCollection, runTask, getAuthorizedUser } from '../stores/telegram';

  import { Dummy, Message, MessageService } from '../widgets/message';
  import { TextAreaDialog, OptionMenu, Dialog } from '../components';
  import Replies from '../widgets/Replies.svelte';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let sendMessageDialog: TextAreaDialog;
  let repliesDialog: Replies;
  let contextMenu: OptionMenu;
  let deleteMessageDialog: Dialog;

  let fetchForwardedUsers = [];
  let forwardedUsersIndex = [];
  const cachedForwardedUsers = {};

  let fetchForwardedChannels = [];
  let forwardedChannelsIndex = [];
  const cachedForwardedChannels = {};

  let padTop: bool = true;
  let ready: bool = false;
  let chat: any;
  let name: string = 'Room';
  let messages: Array<any> = [];
  let messageMetadata: { [key: string]: { index: number, deleted: bool, callback: Function }; } = {};
  let replyIndex: { [key: string]: any; } = {};
  let muteUntil: number|bool = false;

  let navOptions = {
    verticalNavClass: 'roomNav',
    softkeyLeftListener: function(evt) {
      const msg = messages[navInstance.verticalNavIndex];
      if (msg && msg.className === "Message")
        openContextMenu(msg, navInstance.verticalNavIndex);
    },
    softkeyRightListener: function(evt) {
      if (!ready && chat == null)
        return;
      // send attachment + bot command
    },
    enterListener: function(evt) {
      if (!ready && chat == null)
        return;
      if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup && location.state.entity.creator) {
        openSendMessage(null)
      } else {
        openSendMessage(null)
      }
    },
    arrowUpListener: async (evt) => {
      //const { appBar } = getAppProp();
      //if (appBar.getVisibility()) {
        //padTop = appBar.toggleVisibility();
        //const main = document.getElementsByTagName('main');
        //const style = window.getComputedStyle(main[0]);
        //main[0].style.setProperty('top', `calc(${style.top} - 28px)`);
        //main[0].style.setProperty('height', `calc(${style.height} + 28px)`);
      //}
      if (ready && navInstance.verticalNavIndex !== 0) {
        evt.preventDefault();
        navInstance.navigateListNav(-1);
        const msg = messages[navInstance.verticalNavIndex];
        if (msg == null)
          return;
        if (msg.markAsRead)
          msg.markAsRead();
        updateScrollAt(msg);
        if (navInstance.verticalNavIndex == 1) {
          if (!ready)
            return;
          try {
            const msg = messages[navInstance.verticalNavIndex - 1];
            const query = { limit: 50, maxId: msg.id }
            const newMessages = await client.getMessages(chat, query);
            if (newMessages.length > 0) {
              newMessages.reverse();
              const temp = [...newMessages, ...messages];
              messages = await buildIndex(temp);
              navInstance.verticalNavIndex = newMessages.length - 1;
              setTimeout(() => {
                navInstance.navigateListNav(1);
              }, 200);
            }
          } catch (err) {}
        }
      }
    },
    arrowDownListener: async (evt) => {
      //const { appBar } = getAppProp();
      //if (!appBar.getVisibility()) {
        //padTop = appBar.toggleVisibility();
        //const main = document.getElementsByTagName('main');
        //const style = window.getComputedStyle(main[0]);
        //main[0].style.setProperty('top', `calc(${style.top} + 28px)`);
        //main[0].style.setProperty('height', `calc(${style.height} - 28px)`);
      //}
      if (ready && navInstance.verticalNavIndex !== Object.keys(messageMetadata).length - 1) {
        evt.preventDefault();
        navInstance.navigateListNav(1);
        const msg = messages[navInstance.verticalNavIndex];
        if (msg == null)
          return;
        if (msg.markAsRead)
          msg.markAsRead();
        updateScrollAt(msg);
      } else {
        if (!ready)
          return;
        try {
          const msg = messages[navInstance.verticalNavIndex];
          const query = { limit: 50, minId: msg.id }
          const newMessages = await client.getMessages(chat, query);
          if (newMessages.length > 0) {
            newMessages.reverse();
            const temp = [...messages, ...newMessages];
            messages = await buildIndex(temp);
          }
        } catch (err) {}
      }
    },
    backspaceListener: function(evt) {
      evt.preventDefault();
      navigate(-1);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  async function updateScrollAt(msg) {
    const chatId = chat.id.value.toString();
    let pref = await (await cachedDatabase).get('chatPreferences', chatId);
    pref['scrollAt'] = msg.id;
    (await cachedDatabase).put('chatPreferences', pref, chatId);
  }

  function openSendMessage(messageEntity = null, edit = false) {
    sendMessageDialog = new TextAreaDialog({
      target: document.body,
      props: {
        title: 'Message',
        softKeyLeftText: messageEntity != null ? (edit ? 'Save' : 'Reply') : 'Send',
        softKeyCenterText: 'New line',
        softKeyRightText: '',
        value: edit ? messageEntity.message : '',
        placeholder: 'Enter you text',
        type: 'text',
        rows: 3,
        onSoftkeyLeft: async (evt, value) => {
          const msg = value.trim();
          if (msg.length > 0) {
            // console.log(location.state.entity.id.value, msg);
            // console.time('sendMessage');
            try {
              let result;
              if (messageEntity && edit) {
                result = await client.editMessage(chat, { message: messageEntity.id, text: msg });
              } else if (messageEntity) {
                result = await messageEntity.reply({message: msg});
              } else {
                result = await client.sendMessage(chat, {message: msg});
              }
              const tmessages = await client.getMessages(chat, {ids:result.id})
              if (tmessages.length > 0) {
                if (edit && messageMetadata[tmessages[0].id.toString()]) {
                  const idx = messageMetadata[tmessages[0].id.toString()].index;
                  messages[idx] = tmessages[0];
                  messages = [...messages];
                } else {
                  const temp = [...messages, ...tmessages];
                  messages = await buildIndex(temp);
                  autoScroll();
                }
              }
              sendMessageDialog.$destroy();
            } catch (err) {
              console.log(err);
            }
            // console.timeEnd('sendMessage');
          }
        },
        onSoftkeyRight: (evt, value) => {},
        onEnter: (evt, value) => {},
        onBackspace: (evt, value) => {
          evt.stopPropagation();
          if (value.length === 0) {
            sendMessageDialog.$destroy();
            evt.preventDefault();
          }
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (value) => {
          navInstance.attachListener();
          sendMessageDialog = null;
        }
      }
    });
  }

  function showFull(msg, index) {
    const className = new resolveMessageWidget(msg);
    const full = new className({
      target: document.body,
      props: {
        className: "",
        message: msg,
        registerCallButtonHandler: (evt) => {},
        parentNavInstance: navInstance,
        replyTo: getReplyHeader(msg),
        chat: chat,
        short: false,
        scrollable: true,
        destroyCallback: () => {
          full.$destroy();
        }
      }
    });
  }

  function deleteMessage(msg, index) {
    deleteMessageDialog = new Dialog({
      target: document.body,
      props: {
        title: 'Confirm',
        body: 'Do you want to delete this message ?',
        softKeyLeftText: 'Cancel',
        softKeyCenterText: '',
        softKeyRightText: 'Yes',
        onSoftkeyLeft: (evt) => {
          console.log('cancel');
          deleteMessageDialog.$destroy();
        },
        onSoftkeyRight: async (evt) => {
          try {
            await msg.delete();
            const scroll = navInstance.verticalNavIndex !== Object.keys(messageMetadata).length - 1;
            const pops = [];
            const temp = [];
            const id = msg.id;
            if (messageMetadata[id.toString()]) {
              messageMetadata[id.toString()].deleted = true;
              pops.push(messageMetadata[id.toString()].index);
              delete messageMetadata[id.toString()];
              navInstance.navigateListNav(-1);
            }
            for (let i in messages) {
              if (pops.indexOf(parseInt(i)) === -1) {
                temp.push(messages[i]);
              }
            }
            if (temp.length > 0) {
              messages = await buildIndex(temp);
              if (scroll)
                autoScroll();
            }
          } catch (err) {
            console.log(err);
          }
          deleteMessageDialog.$destroy();
        },
        onEnter: (evt) => {},
        onBackspace: (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          deleteMessageDialog.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: () => {
          navInstance.attachListener();
          deleteMessageDialog = null;
        }
      }
    });
  }

  async function pinnedMessage(msg, index) {
    try {
      if (msg.pinned)
        await msg.unpin();
      else
        await msg.pin();
      const tmessages = await client.getMessages(chat, {ids:msg.id})
      if (tmessages.length > 0) {
        messages[index] = tmessages[0];
        messages = [...messages];
      }
    } catch (err) {
      console.log('Unpin:', err);
    }
  }

  async function openContextMenu(msg, index) {
    const user = await getAuthorizedUser();
    let menu = [];
    if (msg.buttons) {
      menu.push({ title: 'Show Reply Buttons' });
    }
    if (msg.message && msg.message.length > 80 || msg.replyTo) {
      menu.push({ title: 'Show Full' });
    }
    if (!msg.noforwards) {
      menu.push({ title: 'Forward' });
    }
    if (msg.replies && msg.replies.replies > 0) {
      menu.push({ title: 'View Replies' });
    }
    menu.push({ title: 'Reply' });
    if (chat.entity.className === 'Channel') {
      menu.push({ title: 'Report' });
    }
    const sender = msg.sender || msg.__sender;
    if (sender && sender.id.value.toString() === user[0].id.value.toString()) {
      menu = [...menu, { title: 'Edit' }, { title: 'Delete' }];
    } else if ((chat.entity.className === 'Channel' && chat.entity.creator) || chat.entity.className === 'User') {
      menu.push({ title: 'Delete' });
    }
    if (msg.pinned && ((chat.entity.className === 'Channel' && chat.entity.creator) || chat.entity.className === 'User')) {
      menu.push({ title: 'Unpin' });
    }
    if (!msg.pinned && ((chat.entity.className === 'Channel' && chat.entity.creator) || chat.entity.className === 'User')) {
      menu.push({ title: 'Pin' });
    }
    if (muteUntil === false) {
      menu.push({ title: 'Mute' });
    } else {
      menu.push({ title: 'Unmute' });
    }
    contextMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Action',
        focusIndex: 0,
        options: menu,
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {},
        onSoftkeyLeft: (evt, scope) => {},
        onEnter: (evt, scope) => {
          contextMenu.$destroy();
          setTimeout(async () => {
            if (scope.selected.title === 'Show Full' && msg.className === "Message") {
              showFull(msg, index);
            } else if (scope.selected.title === 'View Replies' && msg.className === "Message" && msg.replies && msg.replies.replies > 0) {
              showReplies(msg);
            } else if (scope.selected.title === 'Forward') {
              // msg.forwardTo
            } else if (scope.selected.title === 'Reply') {
              openSendMessage(msg);
            } else if (scope.selected.title === 'Report') {
              // msg.?
            } else if (scope.selected.title === 'Edit') {
              openSendMessage(msg, true);
            } else if (scope.selected.title === 'Delete') {
              deleteMessage(msg, index);
            } else if (['Pin', 'Unpin'].indexOf(scope.selected.title) > -1) {
              pinnedMessage(msg, index);
            } else if (scope.selected.title === 'Mute') {
              // chat.
            } else if (scope.selected.title === 'Unmute') {
              // chat.
            } else if (scope.selected.title === 'Show Reply Buttons') {
              // msg.buttons
            }
          }, 200);
        },
        onBackspace: (evt, scope) => {
          evt.preventDefault();
          evt.stopPropagation();
          contextMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          navInstance.attachListener();
          contextMenu = null;
        }
      }
    });
  }

  async function showReplies(msg) {
    if (msg.replies && msg.replies.replies > 0) {
      const query = { limit: msg.replies.replies, replyTo: msg.id }
      const replies = await client.getMessages(chat, query);
      repliesDialog = new Replies({
        target: document.body,
        props: {
          title: 'Replies',
          chat: chat,
          messages: [msg, ...(replies.reverse())],
          resolveMessageWidget: resolveMessageWidget,
          getReplyHeader: getReplyHeader,
          onBackspace: (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            repliesDialog.$destroy();
          },
          onOpened: () => {
            navInstance.detachListener();
          },
          onClosed: (value) => {
            navInstance.attachListener();
            repliesDialog = null;
          }
        }
      });
    }
  }

  function resolveMessageWidget(m) {
    if (m.className === "MessageService") {
      return MessageService;
    } else if (m.className === "Message") {
      return Message;
    }
    return Dummy;
  }

  async function buildIndex(messages) {

    // console.time('buildIndex');
    forwardedUsersIndex = [];
    forwardedChannelsIndex = [];
    const httpTasks = [];
    const websocketTasks = [];
    const fetchReply = [];

    messages.forEach((message, index) => {
      if (message && message.id) {
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
          } else if (message.sender == null && message.senderId != null) {
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

        if (message.fwdFrom) {
          if (message.fwdFrom.fromName) {
            delete message.iconRef;
          } else if (message.fwdFrom.fromId) {
            delete message.iconRef;
            if (message.fwdFrom.fromId.className === 'PeerUser') {
              if (cachedForwardedUsers[message.fwdFrom.fromId.userId.toString()] == null) {
                fetchForwardedUsers.push(message.fwdFrom.fromId);
              }
              forwardedUsersIndex.push(index);
            } else if (message.fwdFrom.fromId.className === 'PeerChannel') {
              if (cachedForwardedChannels[message.fwdFrom.fromId.channelId.toString()] == null) {
                fetchForwardedChannels.push(message.fwdFrom.fromId);
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
      }
    });

    console.log('fetchReply:', fetchReply.length);
    // console.time('fetchReply');
    try {
      const messages = await client.getMessages(chat, {ids:fetchReply});
      fetchReply.forEach((id, index) => {
        replyIndex[id.toString()] = messages[index];
      });
    } catch (err) {
      console.log(err);
    }
    // console.timeEnd('fetchReply');

    console.log('fetchForwardedUsers:', fetchForwardedUsers.length);
    // console.time('fetchForwardedUsers');
    try {
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
        messages[i].fwdFrom.sender = cachedForwardedUsers[messages[i].fwdFrom.fromId.userId.toString()];
        if (!(messages[i].fwdFrom.sender.username == null && messages[i].fwdFrom.sender.phone == null) && messages[i].fwdFrom.sender.photo != null) {
          messages[i].iconRef = messages[i].fwdFrom.sender.photo.photoId.toString();
        } else if (messages[i].fwdFrom.sender.photo != null) {
          messages[i].iconRef = messages[i].fwdFrom.sender.photo.photoId.toString();
        }
      });
      fetchForwardedUsers = [];
    } catch (err) {
      console.log(err);
    }
    // console.timeEnd('fetchForwardedUsers');

    console.log('fetchForwardedChannels:', fetchForwardedChannels.length);
    // console.time('fetchForwardedChannels');
    try {
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
        messages[i].fwdFrom.sender = cachedForwardedChannels[messages[i].fwdFrom.fromId.channelId.toString()];
        if (!(messages[i].fwdFrom.sender.username == null && messages[i].fwdFrom.sender.phone == null) && messages[i].fwdFrom.sender.photo != null) {
          messages[i].iconRef = messages[i].fwdFrom.sender.photo.photoId.toString();
        } else if (messages[i].fwdFrom.sender.photo != null) {
          messages[i].iconRef = messages[i].fwdFrom.sender.photo.photoId.toString();
        }
      });
      fetchForwardedChannels = [];
    } catch (err) {
      console.log(err);
    }
    // console.timeEnd('fetchForwardedChannels');

    runTask(httpTasks, websocketTasks);
    // console.timeEnd('buildIndex');
    return messages;
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
    console.log('Room Listen:', location.state.entity.id.value.toString(), evt.className, evt);
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
      case 'UpdateNewMessage':
        var entities = Array.from(evt._entities.entries());
        for (let i in entities) {
          if (entities[i][1].id.toString() === location.state.entity.id.value.toString()) {
            // Skip for channel, only group or private chat
            if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
              if (!cachedForwardedUsers[evt.message.senderId.value.toString()]) {
                // console.log('Api.users.GetUsers', evt.message.senderId.value.toString());
                // console.time('fetchuncachedforwardsuser');
                try {
                  const users = await client.invoke(new Api.users.GetUsers({ id: [evt.message.senderId.value.toString()] }));
                  if (users.length > 0) {
                    cachedForwardedUsers[users[0].id.toString()] = users[0];
                  }
                } catch (err) {
                  console.log(err);
                }
                // console.timeEnd('fetchuncachedforwardsuser');
              }
            }
            // check message chain before update
            // console.log(evt.message);
            const temp = [...messages, evt.message];
            messages = await buildIndex(temp);
            autoScroll();
            break;
          }
        }
        break;
      case 'UpdateEditChannelMessage':
      case 'UpdateEditMessage':
        var entities = Array.from(evt._entities.entries());
        for (let i in entities) {
          if (entities[i][1].id.toString() === location.state.entity.id.value.toString()) {
            if (messageMetadata[evt.message.id.toString()]) {
              const idx = messageMetadata[evt.message.id.toString()].index;
              messages[idx] = evt.message;
              messages = [...messages];
            }
            break;
          }
        }
        break;
      case 'UpdateDeleteChannelMessages':
      case 'UpdateDeleteMessages':
        const scroll = navInstance.verticalNavIndex !== Object.keys(messageMetadata).length - 1;
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
          if (scroll)
            autoScroll();
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

  async function fetchMessages(entity, scrollAt) {
    // console.time('Finished');
    try {
      const chats = await getChatCollection();
      chat = chats.find(chat => {
        return chat.entity.id.value == entity.id.value;
      });
      // console.log(chat);
      if (chat.dialog.notifySettings.muteUntil) {
        muteUntil = new Date(new Date().getTime() + chat.dialog.notifySettings.muteUntil);
      } else {
        muteUntil = false;
      }
      console.log('muteUntil:', muteUntil);
      let params = { limit: 50 };
      // TOFIX: unstable
      if (scrollAt) {
        //params['maxId'] = scrollAt - 100;
        //params['limit'] = 50;
      }
      const newMessages = await client.getMessages(chat, params);
      newMessages.reverse();
      messages = await buildIndex(newMessages);
      let cursor = messages.findIndex((msg) => {
        return msg.id == scrollAt;
      });
      if (cursor)
        cursor++;
      console.log('scrollAt:', scrollAt, params, newMessages.length, chat.message.id, cursor || messages.length);
      navInstance.navigateListNav(1);
      setTimeout(() => {
        navInstance.navigateListNav(cursor || messages.length);
        if (messages[navInstance.verticalNavIndex].markAsRead)
          messages[navInstance.verticalNavIndex].markAsRead();
      }, 100);
    } catch (err) {
      console.log(err);
    }
    // console.timeEnd('Finished');
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(location.state.name || name);
    fetchMessages(location.state.entity, location.state.scrollAt);
    if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup && location.state.entity.creator) {
      softwareKey.setText({ left: 'Action', center: 'BROADCAST', right: '📎' });
    } else if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup && !location.state.entity.creator) {
      softwareKey.setText({ left: '', center: '', right: '' });
    } else {
      softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
    }
    navInstance.attachListener();
    document.addEventListener('keydown', keydownEventHandler);
    client.addEventHandler(incomingMessageListener);
    ready = true;
  });

  onDestroy(async () => {
    await retrieveChats();
    //const { appBar } = getAppProp();
    //if (!appBar.getVisibility()) {
      //padTop = appBar.toggleVisibility();
      //const main = document.getElementsByTagName('main');
      //const style = window.getComputedStyle(main[0]);
      //main[0].style.setProperty('top', `calc(${style.top} + 28px)`);
      //main[0].style.setProperty('height', `calc(${style.height} - 28px)`);
    //}
    navInstance.detachListener();
    document.removeEventListener('keydown', keydownEventHandler);
    client.removeEventHandler(incomingMessageListener);
  });

</script>

<svelte:options accessors immutable={true}/>

<main id="room-screen" data-pad-top="{padTop ? '38' : '0'}" data-pad-bottom="40">
  {#if ready }
  {#each messages as message}
    {#if message && message.id && messageMetadata[message.id.toString()] && messageMetadata[message.id.toString()].deleted === false}
      <svelte:component className="roomNav" this={resolveMessageWidget(message)} {message} {registerCallButtonHandler} parentNavInstance={navInstance} replyTo={getReplyHeader(message)} chat={chat} short={true} scrollable={false}/>
    {/if}
  {/each}
  {:else}
    <div style="margin-top:45%;">Loading</div>
  {/if}
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
