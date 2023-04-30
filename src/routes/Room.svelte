<script lang="ts">
  import { navigate as goto } from 'svelte-navigator';
  import { createKaiNavigator, KaiNavigator } from '../utils/navigation';
  import { onMount, onDestroy, afterUpdate } from 'svelte';

  import { Api, client, cachedDatabase } from '../utils/bootstrap';

  import { shouldGetDialogs, getDialogList, runTask, getAuthorizedUser } from '../telegram';

  import * as Message from '../widgets/message';
  import { TextAreaDialog, OptionMenu, Dialog } from '../components';
  import Replies from '../widgets/Replies.svelte';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let sendMessageDialog: TextAreaDialog;
  let repliesDialog: Replies;
  let contextMenu: OptionMenu;
  let deleteMessageDialog: Dialog;
  let replyButtons: OptionMenu;
  let entitiesMenu: OptionMenu;

  let fetchForwardedUsers = [];
  let forwardedUsersIndex = [];
  let cachedForwardedUsers = {};

  let fetchForwardedChannels = [];
  let forwardedChannelsIndex = [];
  let cachedForwardedChannels = {};

  let messagesToMerge = [];

  let roomStack = [];
  let scrollAt = 0;
  let ready: bool = false;
  let chat: any;
  let name: string = 'Room';
  let messages: Array<any> = [];
  let messageMetadata: { [key: string]: { index: number, deleted: bool, callback: Function }; } = {};
  let pollMetadata: { [key: string]: any } = {};
  let replyIndex: { [key: string]: any; } = {};
  let muteUntil: number|bool = false;
  let allowAppend: bool = false;

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
    enterListener: async function(evt) {
      if (!ready && chat == null)
        return;
      if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup) { // Channel
        if (location.state.entity.creator) {
          openSendMessage(null)
        } else if (location.state.entity.left) {
          joinChannel();
        } else if (!location.state.entity.left) {
          leaveChannel();
        }
      } else if (location.state.entity.className === 'Channel' && location.state.entity.megagroup) { // Group
        if (location.state.entity.left) {
          joinChannel();
        } else if (!location.state.entity.left) {
          openSendMessage(null)
        }
      } else if (location.state.entity.bot && messages.length == 0) {
        try {
          const result = await client.sendMessage(chat, {message: "/start"});
          const tmessages = await client.getMessages(chat, {ids: result.id})
          if (tmessages.length > 0) {
            pushMessageToMerge(tmessages[0]);
          }
        } catch (err) {
          alert(err.errorMessage);
        }
      } else if (location.state.entity.className !== 'Channel' ) {
        openSendMessage(null)
      }
    },
    arrowUpListener: async (evt) => {
      try {
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
            if (window.confirm('Fetch previous messages ?')) {
              const start = new Date().getTime();
              const msg = messages[navInstance.verticalNavIndex - 1];
              const query = { limit: 50, maxId: msg.id }
              const newMessages = await client.getMessages(chat, query);
              if (newMessages.length > 0) {
                newMessages.reverse();
                const temp = [...newMessages, ...messages];
                messages = await buildIndex(temp);
                navInstance.verticalNavIndex = newMessages.length;
                setTimeout(() => {
                  navInstance.navigateListNav(1);
                }, 200);
              }
              // console.log(`Fetch previous: ${new Date().getTime() - start}ms`);
            }
          }
        }
      } catch (err) {
        console.log('arrowUpListener:', err);
      }
    },
    arrowDownListener: async (evt) => {
      try {
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
          if (window.confirm('Fetch newest messages ?')) {
            const start = new Date().getTime();
            const msg = messages[navInstance.verticalNavIndex];
            const query = { limit: 50, minId: msg.id, reverse: true }
            const newMessages = await client.getMessages(chat, query);
            if (newMessages.length > 0) {
              const temp = [...messages, ...newMessages];
              messages = await buildIndex(temp);
            } else {
              alert('No new messages');
            }
            checkAllowAppend(messages[messages.length - 1].id);
            // console.log(`Fetch newest: ${new Date().getTime() - start}ms`);
          }
        }
      } catch (err) {
        console.log('arrowDownListener:', err);
      }
    },
    backspaceListener: function(evt) {
      evt.preventDefault();
      if (roomStack.length > 0) {
        const prev = roomStack.pop();
        const { appBar } = getAppProp();
        location.state.name = prev.name;
        location.state.entity = prev.entity
        location.state.scrollAt = prev.scrollAt
        appBar.setTitleText(location.state.name);
        fetchForwardedUsers = [];
        forwardedUsersIndex = [];
        cachedForwardedUsers = {};
        fetchForwardedChannels = [];
        forwardedChannelsIndex = [];
        cachedForwardedChannels = {};
        messagesToMerge = [];
        messageMetadata = {};
        pollMetadata = {};
        replyIndex = {};
        messages = [];
        fetchMessages(location.state.entity, location.state.scrollAt);
      } else {
        shouldGetDialogs.update(n => true);
        navigate(-1);
      }
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  async function updateScrollAt(msg) {
    scrollAt = msg.id;
    try {
      const chatId = chat.entity.id.value.toString();
      let pref = await (await cachedDatabase).get('chatPreferences', chatId);
      pref['scrollAt'] = msg.id;
      (await cachedDatabase).put('chatPreferences', pref, chatId);
    } catch (err) {
      // console.log('updateScrollAt:', err);
    }
  }

  async function joinChannel() {
    try {
      const { softwareKey } = getAppProp();
      const channels = await client.invoke(new Api.channels.GetChannels({ id: [location.state.entity.id.value] }));
      await client.invoke(new Api.channels.JoinChannel({ channel: channels.chats[0] }));
      location.state.entity.left = false;
      if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup) { // Channel
        if (location.state.entity.creator) {
          softwareKey.setText({ left: 'Action', center: 'BROADCAST', right: '📎' });
        } else if (location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'SUB', right: '' });
        } else if (!location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'UNSUB', right: '' });
        }
      } else if (location.state.entity.className === 'Channel' && location.state.entity.megagroup) { // Group
        if (location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'JOIN', right: '' });
        } else if (!location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
        }
      }
    } catch (err) {
      console.log('joinChannel', err);
    }
  }

  async function leaveChannel() {
    if (!confirm('Are you sure to leave ?')) {
      return;
    }
    try {
      const { softwareKey } = getAppProp();
      const channels = await client.invoke(new Api.channels.GetChannels({ id: [location.state.entity.id.value] }));
      await client.invoke(new Api.channels.LeaveChannel({ channel: channels.chats[0] }))
      location.state.entity.left = true;
      if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup) { // Channel
        if (location.state.entity.creator) {
          softwareKey.setText({ left: 'Action', center: 'BROADCAST', right: '📎' });
        } else if (location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'SUB', right: '' });
        } else if (!location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'UNSUB', right: '' });
        }
      } else if (location.state.entity.className === 'Channel' && location.state.entity.megagroup) { // Group
        if (location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'JOIN', right: '' });
        } else if (!location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
        }
      }
    } catch (err) {
      console.log('leaveChannel', err);
    }
  }

  function openSendMessage(messageEntity = null, edit = false) {
    try {
      sendMessageDialog = new TextAreaDialog({
        target: document.body,
        props: {
          title: 'Message',
          softKeyLeftText: messageEntity != null ? (edit ? 'Save' : 'Reply') : 'Send',
          softKeyCenterText: 'New line',
          softKeyRightText: 'Cancel',
          value: edit ? messageEntity.message : '',
          placeholder: 'Enter you text',
          type: 'text',
          rows: 3,
          onSoftkeyLeft: async (evt, value) => {
            const msg = value.trim();
            if (msg.length > 0) {
              const _start = new Date().getTime();
              sendMessageDialog.$destroy();
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
                  pushMessageToMerge(tmessages[0]);
                }
              }
              // console.log(`sendMessage: ${new Date().getTime() - _start}ms`);
            }
          },
          onSoftkeyRight: (evt, value) => {
            sendMessageDialog.$destroy();
          },
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
    } catch (err) {
      console.log('openSendMessage:', err);
    }
  }

  function showFull(msg, index) {
    const className = new resolveMessageWidget(msg);
    const full = new className({
      target: document.body,
      props: {
        className: "",
        message: msg,
        callButtonCallback: (evt) => {},
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
    try {
      deleteMessageDialog = new Dialog({
        target: document.body,
        props: {
          title: 'Confirm',
          body: 'Do you want to delete this message ?',
          softKeyLeftText: 'Cancel',
          softKeyCenterText: '',
          softKeyRightText: 'Yes',
          onSoftkeyLeft: (evt) => {
            deleteMessageDialog.$destroy();
          },
          onSoftkeyRight: async (evt) => {
            await client.deleteMessages(chat, [msg.id], {revoke: true});
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
              if (!isNaN(parseInt(i))) {
                if (pops.indexOf(parseInt(i)) === -1) {
                  temp.push(messages[i]);
                }
              }
            }
            if (temp.length > 0) {
              messages = await buildIndex(temp);
              if (scroll)
                autoScroll();
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
    } catch (err) {
      console.log('deleteMessage:', err);
    }
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
      console.log('pinnedMessage', err);
    }
  }

  function showReplyButtons(msg) {
    try {
      const buttons = [];
      // ReplyKeyboardHide | ReplyKeyboardForceReply | ReplyKeyboardMarkup.row | ReplyInlineMarkup.row
      msg.replyMarkup.rows.forEach(row => {
        row.buttons.forEach(button => {
          buttons.push({ title: button.text, subtitle: null, button: button });
        });
      });
      replyButtons = new OptionMenu({
        target: document.body,
        props: {
          title: 'Reply Buttons',
          focusIndex: 0,
          options: buttons,
          softKeyCenterText: 'select',
          onSoftkeyRight: (evt, scope) => {},
          onSoftkeyLeft: (evt, scope) => {},
          onEnter: async (evt, scope) => {
            replyButtons.$destroy();
            // https://gram.js.org/beta/classes/Api.Message.html#click
            const result = await msg.click(scope.selected.button);
            if (result) {
              if (result.className && result.className === "messages.BotCallbackAnswer" && result.message) {
                alert(result.message);
              } else if ((result.className && result.className === "messages.BotCallbackAnswer" && result.url) || typeof result === 'string') {
                handleTelegramLink(result.url || result);
              } else if (result.className && result.className === "Message") {
                const tmessages = await client.getMessages(chat, { limit: 1, ids: result.id });
                if (tmessages.length > 0) {
                  pushMessageToMerge(tmessages[0]);
                }
              }
            }
          },
          onBackspace: (evt, scope) => {
            evt.preventDefault();
            evt.stopPropagation();
            replyButtons.$destroy();
          },
          onOpened: () => {
            navInstance.detachListener();
          },
          onClosed: (scope) => {
            navInstance.attachListener();
            replyButtons = null;
          }
        }
      });
    } catch (err) {
      console.log('showReplyButtons:', err);
    }
  }

  function handleTelegramLink(url) {
    const parsed = new URL(url);
    if (parsed.hostname.indexOf('t.me') > -1) {
      const t_entity = parsed.hostname.split('.');
      if (t_entity.length === 3) {
        if (parsed.pathname == '/') {
          openRoom(t_entity[0]);
        } else {
          const t_pathname = parsed.pathname.split('/');
          if (t_pathname.length == 2) {
            const scrollTo = parseInt(t_pathname[1]);
            openRoom(t_entity[0], isNaN(scrollTo) ? null : scrollTo);
          } else {
            openRoom(t_entity[0]);
          }
        }
      } else if (t_entity.length === 2 || parsed.hostname.indexOf('telegram.me') > -1) {
        const t_entity = parsed.pathname.split('/');
        if (t_entity.length == 2) {
          openRoom(t_entity[1]);
        } else if (t_entity.length == 3) {
          const scrollTo = parseInt(t_entity[2]);
          openRoom(t_entity[1], isNaN(scrollTo) ? null : scrollTo);
        } else {
          window.open(url);
        }
      } else {
        window.open(url);
      }
    } else {
      window.open(url);
    }
  }

  async function openRoom(value: any, scrollTo: number|null) {
    try {
      const entity = await client.getEntity(value);
      if (entity.id.value.toString() === location.state.entity.id.value.toString())
        return;
      roomStack.push({ name: location.state.name, entity: location.state.entity, scrollAt: scrollAt });
      const { appBar } = getAppProp();
      let name = '';
      if (entity.firstName)
        name = entity.firstName;
      if (entity.lastName)
        name += ' ' + entity.lastName;
      if (name === '' && entity.username)
        name = entity.username;
      else if (name === '' && entity.phone)
        name = entity.phone;
      else if (name === '')
        name = entity.id.value.toString();
      location.state.name = name;
      location.state.entity = entity;
      location.state.scrollAt = scrollTo || null;
      appBar.setTitleText(location.state.name || name);
      fetchForwardedUsers = [];
      forwardedUsersIndex = [];
      cachedForwardedUsers = {};
      fetchForwardedChannels = [];
      forwardedChannelsIndex = [];
      cachedForwardedChannels = {};
      messagesToMerge = [];
      messageMetadata = {};
      pollMetadata = {};
      replyIndex = {};
      messages = [];
      fetchMessages(location.state.entity, location.state.scrollAt);
    } catch (err) {
      roomStack.pop();
    }
  }

  function showEntities(entities) {
    entitiesMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Entities',
        focusIndex: 0,
        options: entities,
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {},
        onSoftkeyLeft: (evt, scope) => {},
        onEnter: async (evt, scope) => {
          entitiesMenu.$destroy();
          if (scope.selected.args.className === 'MessageEntityMention') {
            openRoom(scope.selected.title.replace('@', ''));
          } else if (scope.selected.args.className === 'MessageEntityBotCommand') {
            try {
              const result = await client.sendMessage(chat, {message: scope.selected.title});
              const tmessages = await client.getMessages(chat, {ids: result.id})
              if (tmessages.length > 0) {
                pushMessageToMerge(tmessages[0]);
              }
            } catch (err) {
              console.log('MessageEntityBotCommand:', err);
            }
          } else if (scope.selected.args.className === 'MessageEntityUrl') {
            handleTelegramLink(scope.selected.title);
          } else if (scope.selected.args.className === 'MessageEntityEmail') {
            window.open(`mailto:${scope.selected.title}`);
          } else if (scope.selected.args.className === 'MessageEntityTextUrl') {
            window.open(scope.selected.args.url);
          } else if (['MessageEntityMentionName', 'InputMessageEntityMentionName'].indexOf(scope.selected.args.className) > -1) {
            openRoom(scope.selected.args.userId);
          } else if (scope.selected.args.className === 'MessageEntityPhone') {
            window.open(`tel:${scope.selected.title}`);
          }
        },
        onBackspace: (evt, scope) => {
          evt.preventDefault();
          evt.stopPropagation();
          entitiesMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          navInstance.attachListener();
          entitiesMenu = null;
        }
      }
    });
  }

  async function archivingChat() {
    if (chat && chat.inputEntity) {
      let folderId;
      if (chat.archived) {
        folderId = 0;
      } else {
        folderId = 1;
      }
      try {
        const result = await client.invoke(
          new Api.folders.EditPeerFolders({
            folderPeers: [
              new Api.InputFolderPeer({
                peer: chat.inputEntity,
                folderId: folderId,
              }),
            ],
          })
        );
        // console.log(result);
        chat.archived = !chat.archived;
      } catch (err) {
        console.log(err);
      }
    }
  }

  async function openContextMenu(msg, index) {
    let len = 0;
    let entities = [];
    if (msg.entities) {
      msg.entities.forEach((e, i) => {
        if (['MessageEntityMention', 'MessageEntityBotCommand', 'MessageEntityUrl', 'MessageEntityEmail', 'MessageEntityTextUrl', 'MessageEntityMentionName', 'InputMessageEntityMentionName', 'MessageEntityPhone'].indexOf(e.className) > -1) {
          entities.push({ title: msg.message.substring(e.offset, e.offset + e.length), subtitle: e.className, args: e });
        }
      });
    }
    try {
      const user = await getAuthorizedUser();
      let menu = [];
      if (entities.length > 0) {
        menu.push({ title: 'Entities' });
      }
      if (msg.media) {
        menu.push({ title: 'Message Media' });
      }
      if (msg.replyMarkup && msg.replyMarkup.rows) {
        let show = true;
        if (['ReplyKeyboardHide', 'ReplyKeyboardForceReply', 'ReplyKeyboardMarkup'].indexOf(msg.replyMarkup.className) > -1 && msg.replyMarkup.selective) {
          show = false;
        }
        if (show)
          menu.push({ title: 'Show Reply Buttons' });
      }
      menu.push({ title: 'Show Full' });
      const isReply = getReplyHeader(msg);
      if (isReply !== false && isReply !== -1) {
        menu.push({ title: 'Show Reply Header' });
      }
      if (!msg.noforwards) {
        menu.push({ title: 'Forward' });
      }
      if (msg.replies && msg.replies.replies > 0) {
        menu.push({ title: 'Discussion' });
      }
      if ((chat.entity.className === 'Channel' && chat.entity.creator) || (chat.entity.className === 'Channel' && chat.entity.megagroup && !chat.entity.left) || chat.entity.className === 'User') {
        menu.push({ title: 'Reply' });
      }
      const sender = msg.sender || msg.__sender;
      if (sender && sender.id.value.toString() === user[0].id.value.toString()) {
        if ((new Date().getTime() - new Date(msg.date * 1000).getTime() < 172800000 || chat.entity.__isSavedMessages) && msg.fwdFrom == null) {
          menu.push({ title: 'Edit' });
        }
        menu.push({ title: 'Delete' });
      } else if ((chat.entity.className === 'Channel' && chat.entity.creator) || chat.entity.className === 'User') {
        menu.push({ title: 'Delete' });
      }
      if (msg.pinned && ((chat.entity.className === 'Channel' && chat.entity.creator) || chat.entity.className === 'User')) {
        menu.push({ title: 'Unpin' });
      }
      if (!msg.pinned && ((chat.entity.className === 'Channel' && chat.entity.creator) || chat.entity.className === 'User')) {
        menu.push({ title: 'Pin' });
      }
      if ((chat.entity.className === 'Channel' && !chat.entity.left) || chat.entity.className === 'User') {
        if (muteUntil === false) {
          menu.push({ title: 'Mute Chat' });
        } else {
          menu.push({ title: 'Unmute Chat' });
        }
      }
      if (chat.archived) {
        menu.push({ title: 'Unarchive' });
      } else {
        menu.push({ title: 'Archive' });
      }
      if (chat.entity.className === 'Channel') {
        menu.push({ title: 'Report' });
      }
      if (chat.entity.className === 'Channel' && chat.entity.megagroup && !chat.entity.left && !location.state.entity.creator) {
        menu.push({ title: 'Leave Group' });
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
              if (scope.selected.title ==='Entities') {
                showEntities(entities);
              } else if (scope.selected.title === 'Message Media') {
                if (msg && msg.id.toString()) {
                  if (messageMetadata[msg.id.toString()]) {
                    const cb = messageMetadata[msg.id.toString()].callback;
                    cb && cb();
                  }
                }
              } else if (scope.selected.title === 'Show Full' && msg.className === "Message") {
                showFull(msg, index);
              } else if (scope.selected.title === 'Discussion' && msg.className === "Message" && msg.replies && msg.replies.replies > 0) {
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
              } else if (scope.selected.title === 'Mute Chat') {
                // chat.
              } else if (scope.selected.title === 'Unmute Chat') {
                // chat.
              } else if (scope.selected.title === 'Show Reply Buttons') {
                showReplyButtons(msg);
              } else if (scope.selected.title === 'Show Reply Header') {
                showReplies(getReplyHeader(msg), true);
              } else if (scope.selected.title === 'Leave Group') {
                leaveChannel();
              } else if (['Archive','Unarchive'].indexOf(scope.selected.title) > -1) {
                archivingChat();
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
    } catch (err) {
      console.log('openContextMenu:'. err);
    }
  }

  async function showReplies(msg, reply = false) {
    try {
      if (msg.replies && msg.replies.replies > 0 || reply) {
        let replies;
        if (reply) {
          replies = [msg];
        } else {
          const httpTasks = [];
          const websocketTasks = [];
          const fetchReply = [];
          const query = { limit: msg.replies.replies, replyTo: msg.id }
          replies = await client.getMessages(chat, query);
          replies.forEach(message => {
            const sender = message.sender || message.__sender;
            if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
              if (sender && !(sender.username == null && sender.phone == null) && sender.photo != null && sender.photo.photoId) {
                message.iconRef = sender.photo.photoId.toString();
                httpTasks.push({
                  url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${sender.phone === "42777" ? 'telegram' : sender.username}`,
                  photoId: sender.photo.photoId.toString(),
                  chat: sender,
                  origin: { chat, message },
                });
              } else if (sender && sender.photo != null && sender.photo.photoId) {
                message.iconRef = sender.photo.photoId.toString();
                websocketTasks.push({
                  photoId: sender.photo.photoId.toString(),
                  chat: sender,
                  origin: { chat, message },
                });
                // console.log(sender); // no username
              }
            }
          });
          runTask(httpTasks, websocketTasks); // non-blocking
        }
        repliesDialog = new Replies({
          target: document.body,
          props: {
            replyThreadId: msg.id,
            title: reply ? 'Reply' : 'Discussion',
            chat: chat,
            messages: reply ? replies : [msg, ...(replies.reverse())],
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
    } catch (err) {
      console.log('showReplies:', err);
    }
  }

  function resolveMessageWidget(m) {
    if (Message[m.className])
      return Message[m.className];
    return Message.Dummy;
  }

  async function buildIndex(_messages) {
    const _start_ = new Date().getTime();
    forwardedUsersIndex = [];
    forwardedChannelsIndex = [];
    const httpTasks = [];
    const websocketTasks = [];
    const fetchReply = [];

    _messages.forEach((message, index) => {
      if (message && message.id) {
        if (messageMetadata[message.id.toString()] == null) {
          messageMetadata[message.id.toString()] = {}
        }
        messageMetadata[message.id.toString()].index = index;
        messageMetadata[message.id.toString()].deleted = false;
        if (message.media && message.media.poll) {
          pollMetadata[message.media.poll.id.value.toString()] = message.id.toString();
        }

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
            if (sender && !(sender.username == null && sender.phone == null) && sender.photo != null && sender.photo.photoId) {
              message.iconRef = sender.photo.photoId.toString();
              httpTasks.push({
                url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${sender.phone === "42777" ? 'telegram' : sender.username}`,
                photoId: sender.photo.photoId.toString(),
                chat: sender,
                origin: { chat, message },
              });
            } else if (sender && sender.photo != null && sender.photo.photoId) {
              message.iconRef = sender.photo.photoId.toString();
              websocketTasks.push({
                photoId: sender.photo.photoId.toString(),
                chat: sender,
                origin: { chat, message },
              });
              // console.log(sender); // no username
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

    if (fetchReply.length > 0) {
      const _start = new Date().getTime();
      try {
        const fmessages = await client.getMessages(chat, {ids:fetchReply});
        fetchReply.forEach((id, index) => {
          replyIndex[id.toString()] = fmessages[index];
        });
      } catch (err) {
        console.log('fetchReply:', err);
      }
      // console.log(`fetchReply: ${new Date().getTime() - _start}ms`);
    }

    if (fetchForwardedUsers.length > 0) {
      const _start = new Date().getTime();
      try {
        const users = await client.invoke(new Api.users.GetUsers({ id: fetchForwardedUsers }));
        users.forEach(u => {
          cachedForwardedUsers[u.id.toString()] = u;
          if (!(u.username == null && u.phone == null) && u.photo != null && u.photo.photoId) {
            httpTasks.push({
              url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${u.phone === "42777" ? 'telegram' : u.username}`,
              photoId: u.photo.photoId.toString(),
              chat: u,
              //origin: { chat, message }, // TODO
            })
          } else if (u.photo != null && u.photo.photoId) {
            websocketTasks.push({
              photoId: u.photo.photoId.toString(),
              chat: u,
              //origin: { chat, message }, // TODO
            })
            // console.log(u); // no username
          }
        });
      } catch (err) {
        console.log('fetchForwardedUsers:', err);
      }
      // console.log(`fetchForwardedUsers: ${new Date().getTime() - _start}ms`);
    }
    forwardedUsersIndex.forEach(i => {
      try {
        _messages[i].fwdFrom.sender = cachedForwardedUsers[_messages[i].fwdFrom.fromId.userId.toString()];
        if (!(_messages[i].fwdFrom.sender.username == null && _messages[i].fwdFrom.sender.phone == null) && _messages[i].fwdFrom.sender.photo != null && _messages[i].fwdFrom.sender.photo.photoId) {
          _messages[i].iconRef = _messages[i].fwdFrom.sender.photo.photoId.toString();
        } else if (_messages[i].fwdFrom.sender.photo != null) {
          _messages[i].iconRef = _messages[i].fwdFrom.sender.photo.photoId.toString();
        }
      } catch (err) {}
    });
    fetchForwardedUsers = [];

    if (fetchForwardedChannels.length > 0) {
      const _start = new Date().getTime();
      try {
        const channels = await client.invoke(new Api.channels.GetChannels({ id: fetchForwardedChannels }));
        channels.chats.forEach(c => {
          cachedForwardedChannels[c.id.toString()] = c;
          if (!(c.username == null && c.phone == null) && c.photo != null && c.photo.photoId) {
            httpTasks.push({
              url: `https://api.codetabs.com/v1/proxy/?quest=https://t.me/${c.phone === "42777" ? 'telegram' : c.username}`,
              photoId: c.photo.photoId.toString(),
              chat: c,
              //origin: { chat, message }, // TODO
            })
          } else if (c.photo != null && c.photo.photoId) {
            websocketTasks.push({
              photoId: c.photo.photoId.toString(),
              chat: c,
              //origin: { chat, message }, // TODO
            })
          }
        });
      } catch (err) {
        console.log('fetchForwardedChannels:', err);
      }
      // console.log(`fetchForwardedChannels: ${new Date().getTime() - _start}ms`);
    }
    forwardedChannelsIndex.forEach(i => {
      try {
        _messages[i].fwdFrom.sender = cachedForwardedChannels[_messages[i].fwdFrom.fromId.channelId.toString()];
        if (!(_messages[i].fwdFrom.sender.username == null && _messages[i].fwdFrom.sender.phone == null) && _messages[i].fwdFrom.sender.photo != null && _messages[i].fwdFrom.sender.photo.photoId) {
          _messages[i].iconRef = _messages[i].fwdFrom.sender.photo.photoId.toString();
        } else if (_messages[i].fwdFrom.sender.photo != null && _messages[i].fwdFrom.sender.photo.photoId) {
          _messages[i].iconRef = _messages[i].fwdFrom.sender.photo.photoId.toString();
        }
      } catch (err) {}
    });
    fetchForwardedChannels = [];

    runTask(httpTasks, websocketTasks); // non-blocking
    // console.log(`buildIndex: ${new Date().getTime() - _start_}ms`);
    return _messages;
  }

  function callButtonCallback(id, callback) {
    if (messageMetadata[id]) {
      messageMetadata[id].callback = callback;
    }
  }

  async function merging() {
    try {
      const msg = messagesToMerge.pop();
      const temp = [...messages, msg];
      messages = await buildIndex(temp);
      autoScroll();
    } catch (err) {
      console.log('merging:', err);
    }
  }

  function pushMessageToMerge(msg) {
    if (!allowAppend)
      return
    // console.log('pushMessageToMerge', msg.id);
    const len = messagesToMerge.length;
    if (len === 0) {
      messagesToMerge.push(msg);
    } else {
      if (messagesToMerge[len - 1].date > msg.date) {
        messagesToMerge = [msg, ...messagesToMerge];
      } else {
        messagesToMerge = [...messagesToMerge, msg];
      }
    }
    if (len === 0)
      merging();
  }

  async function checkAllowAppend(id: number) {
    const query = { limit: 1, minId: id, reverse: true };
    const nextMessages = await client.getMessages(chat, query);
    if (nextMessages.length == 0) {
      allowAppend = true;
    } else {
      allowAppend = false;
    }
  }

  async function fetchMessageCallback(id: number) {
    try {
      id = id.toString();
      if (messageMetadata[id] && messages[messageMetadata[id].index]) {
        const update = await client.getMessages(chat, {ids: messages[messageMetadata[id].index].id});
        if (update.length > 0) {
          messages[messageMetadata[id].index] = update[0];
          messages = [...messages];
        }
      }
    } catch (err) {
      console.log('fetchMessageCallback:', err);
    }
  }

  async function clientListener(evt) {
    if (chat.entity.__isSavedMessages)
      return;
    try {
      // console.log('Room :', location.state.entity.id.value.toString(), evt.className, evt);
      switch (evt.className) {
        case "UpdateNotifySettings":
          const id = evt.peer.peer.channelId ? evt.peer.peer.channelId.value.toString() : evt.peer.peer.userId.value.toString();
          if (id !== chat.entity.id.value.toString())
            break;
          if (evt.notifySettings.muteUntil) {
            muteUntil = new Date(new Date().getTime() + evt.notifySettings.muteUntil);
          } else {
            muteUntil = false;
          }
          // console.log('muteUntil:', muteUntil);
          break;
        case 'UpdateMessagePoll':
          if (pollMetadata[evt.pollId.value.toString()]) {
            const id = pollMetadata[evt.pollId.value.toString()];
            const update = await client.getMessages(chat, {ids: messages[messageMetadata[id].index].id});
            if (update.length > 0) {
              messages[messageMetadata[id].index] = update[0];
              messages = [...messages];
            }
          }
          break;
        case 'UpdateShortMessage':
          if (evt.userId && evt.userId.value.toString() === location.state.entity.id.value.toString()) {
            const tmessages = await client.getMessages(chat, {ids: evt.id});
            if (tmessages.length > 0) {
              pushMessageToMerge(tmessages[0]);
            }
          }
          break;
        case 'UpdateNewChannelMessage':
        case 'UpdateNewMessage':
          client.invoke(new Api.messages.ReceivedMessages({ maxId: evt.message.id }));
          var entities = Array.from(evt._entities.entries());
          for (let i in entities) {
            if (entities[i][1].id.toString() === location.state.entity.id.value.toString()) {
              // Skip for channel, only group or private chat
              if (!(location.state.entity.className === 'Channel' && !location.state.entity.megagroup)) {
                if (!cachedForwardedUsers[evt.message.senderId.value.toString()]) {
                  const _start = new Date().getTime()
                  const users = await client.invoke(new Api.users.GetUsers({ id: [evt.message.senderId.value.toString()] }));
                  if (users.length > 0) {
                    cachedForwardedUsers[users[0].id.toString()] = users[0];
                  }
                  // console.log(`fetchuncachedforwardsuser: ${new Date().getTime() - _start}ms`);
                }
              }
              const tmessages = await client.getMessages(chat, { limit: 1, ids: evt.message.id });
              if (tmessages.length > 0) {
                pushMessageToMerge(tmessages[0]);
              }
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
            if (!isNaN(parseInt(i))) {
              if (pops.indexOf(parseInt(i)) === -1) {
                temp.push(messages[i]);
              }
            }
          }
          if (temp.length > 0) {
            messages = await buildIndex(temp);
            if (scroll)
              autoScroll();
          }
          break;
      }
    } catch (err) {
      console.log(evt.className + ':', err);
    }
  }

  function autoScroll() {
    setTimeout(() => {
      if (Object.keys(messageMetadata).length - navInstance.verticalNavIndex === 2)
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

  async function fetchMessages(entity, _scrollAt) {
    const { softwareKey } = getAppProp();
    // console.log('%cSTART', 'background: #222; color: #bada55');
    const _start = new Date().getTime();
    try {
      const chats = await getDialogList();
      chat = chats.find(chat => {
        return chat.entity.id.value == entity.id.value;
      });
      if (chat == null) {
        chat = {};
        if (entity.className === 'User') {
          const result = await client.invoke(new Api.users.GetUsers({
            id: [entity.id.value]
          }));
          chat.entity = result[0];
          chat.isChannel = false;
          chat.isGroup = false;
          chat.isUser = true;
        } else {
          const result = await client.invoke(new Api.channels.GetChannels({
            id: [entity.id.value]
          }));
          chat.entity = result.chats[0];
          if (entity.megagroup) {
            chat.isChannel = true;
            chat.isGroup = true;
            chat.isUser = false;
          } else {
            chat.isChannel = true;
            chat.isGroup = false;
            chat.isUser = false;
          }
        }
      }
      if (chat.entity == null)
        chat.entity = entity;
      if (chat.entity)
        muteUntil = chat.entity.__muted || false;
      let latestMessages = [];
      let msgToscrollAt = [];
      if (_scrollAt != null) {
        msgToscrollAt = await client.getMessages(chat.entity, { limit: 1, ids: [_scrollAt] });
      }
      if (msgToscrollAt.length == 0 || (msgToscrollAt.length == 1 && msgToscrollAt[0] == null)) {
        latestMessages = await client.getMessages(chat.entity, { limit: 20 });
      } else {
        const minId = await client.getMessages(chat.entity, { limit: 10, minId: _scrollAt, reverse: true });
        minId.reverse();
        const maxId = await client.getMessages(chat.entity, { limit: 10, maxId: _scrollAt });
        latestMessages = [...minId, ...msgToscrollAt, ...maxId];
      }

      latestMessages.reverse();
      messages = await buildIndex(latestMessages);

      if (messages.length > 0 ) {
        checkAllowAppend(messages[messages.length - 1].id);
      }

      if (location.state.entity.className === 'Channel' && !location.state.entity.megagroup) { // Channel
        if (location.state.entity.creator) {
          softwareKey.setText({ left: 'Action', center: 'BROADCAST', right: '📎' });
        } else if (location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'SUB', right: '' });
        } else if (!location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'UNSUB', right: '' });
        }
      } else if (location.state.entity.className === 'Channel' && location.state.entity.megagroup) { // Group
        if (location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'JOIN', right: '' });
        } else if (!location.state.entity.left) {
          softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
        }
      } else if (location.state.entity.bot && messages.length == 0) {
        softwareKey.setText({ left: 'Action', center: 'START', right: '📎' });
      } else {
        softwareKey.setText({ left: 'Action', center: 'SEND', right: '📎' });
      }

      let cursor = messages.findIndex((msg) => {
        return msg.id == _scrollAt;
      });
      if (cursor)
        cursor++;
      navInstance.verticalNavIndex = -1;
      navInstance.navigateListNav(1);
      setTimeout(() => {
        navInstance.navigateListNav(cursor || Object.keys(messageMetadata).length);
        if (messages[navInstance.verticalNavIndex] && messages[navInstance.verticalNavIndex].markAsRead) {
          messages[navInstance.verticalNavIndex].markAsRead();
          scrollAt = messages[navInstance.verticalNavIndex].id;
        }
      }, 300);
    } catch (err) {
      console.log('fetchMessages:', err);
    }
    // console.log(`fetchMessages: ${new Date().getTime() - _start}ms`);
    // console.log('%cFINISH', 'background: #222; color: #bada55');
  }

  afterUpdate(() => {
    if (messagesToMerge.length > 0)
      merging();
  })

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(location.state.name || name);
    fetchMessages(location.state.entity, location.state.scrollAt);
    // console.log('location.state.scrollAt', location.state.scrollAt);
    navInstance.attachListener();
    client.addEventHandler(clientListener);
    ready = true;
  });

  onDestroy(() => {
    navInstance.detachListener();
    client.removeEventHandler(clientListener);
  });

</script>

<svelte:options accessors immutable={true}/>

<main id="room-screen" data-pad-top="50" data-pad-bottom="30">
  {#if ready }
  {#each messages as message}
    {#if message && message.id && messageMetadata[message.id.toString()] && messageMetadata[message.id.toString()].deleted === false}
      <svelte:component className="roomNav" this={resolveMessageWidget(message)} {message} {callButtonCallback} {fetchMessageCallback} parentNavInstance={navInstance} replyTo={getReplyHeader(message)} chat={chat} short={true} scrollable={false} replyThreadId={null}/>
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
