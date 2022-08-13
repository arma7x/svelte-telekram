<script lang="ts">
  import { Route, navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { ListView, LoadingBar, Button, TextInputField, Toast, Toaster, SoftwareKey, TextInputDialog, OptionMenu } from '../components';
  import { onMount, onDestroy } from 'svelte';

  import { TelegramKeyHash, Api, client, session, cachedDatabase } from '../utils/bootstrap';

  import QRModal from '../widgets/QRModal.svelte';
  import ChatListView from '../widgets/ChatListView.svelte';
  import ArchivedChats from '../widgets/ArchivedChats.svelte';
  import ContactList from '../widgets/ContactList.svelte';

  import { connectionStatus, authorizedStatus, isUserAuthorized, authorizedUser, chatCollections, retrieveChats, cachedThumbnails } from '../stores/telegram';

  const navClass: string = 'homeNav';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let loadingBar: LoadingBar;
  let inputSoftwareKey: SoftwareKey;
  let qrModal: QRModal;
  let password2FA: TextInputDialog;
  let authorizedMenu: OptionMenu;
  let archivedChatListMenu: ArchivedChats;
  let contactListMenu: ContactList;

  let unchatCollections;
  let unauthorizedStatus;
  let unconnectionStatus;
  let uncachedThumbnails;
  let unauthorizedUser;

  let name: string = 'Telekram';
  let phoneNumber = '';
  let phoneCode = '';
  let phoneCodeHash = null;
  let qrCode = null;
  let authStatus: boolean = false;
  let archivedChatList = [];
  let archivedChatListName = [];
  let user = [];

  let chatList = [];
  let thumbs = {};

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (inputSoftwareKey || qrModal|| password2FA)
        return;
      if (authStatus)
        openAuthorizedMenu();
    },
    softkeyRightListener: function(evt) {
      if (inputSoftwareKey || qrModal|| password2FA)
        return;
    },
    enterListener: function(evt) {
      if (inputSoftwareKey || qrModal|| password2FA)
        return;
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        navClasses[this.verticalNavIndex].click();
      }
    },
    backspaceListener: function(evt) {},
    arrowLeftListener: function(evt) {},
    arrowRightListener: function(evt) {},
  };

  let navInstance = createKaiNavigator(navOptions);

  function openArchivedChatListMenu() {
    archivedChatListMenu = new ArchivedChats({
      target: document.body,
      props: {
        title: 'Archived Chats',
        focusIndex: 0,
        options: archivedChatList,
        thumbs: thumbs,
        softKeyLeftText: 'Unarchive',
        softKeyCenterText: 'Select',
        softKeyRightText: '',
        onSoftkeyRight: (evt, scope) => {
          archivedChatListMenu.$destroy();
        },
        onSoftkeyLeft: (evt, scope) => {
          archivedChatListMenu.$destroy();
        },
        onEnter: (evt, scope) => {
          archivedChatListMenu.$destroy();
          setTimeout(() => {
            openRoom(scope.selected.name, scope.selected);
          }, 100);
        },
        onBackspace: (evt, scope) => {
          evt.preventDefault();
          evt.stopPropagation();
          archivedChatListMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          navInstance.attachListener();
          archivedChatListMenu = null;
        }
      }
    });
  }

  async function getContacts() {
    try {
      const result = await client.invoke(
        new Api.contacts.GetContacts()
      );
      const sorted = result.users.sort((a, b) => {
        return [a.firstName || '', a.lastName || '', a.phone || ''].join(' ').localeCompare([b.firstName || '', b.lastName || '', b.phone || ''].join(' '));
      });
      contactListMenu = new ContactList({
        target: document.body,
        props: {
          title: 'Contact List',
          focusIndex: 0,
          sources: sorted,
          thumbs: thumbs,
          softKeyLeftText: 'Search',
          softKeyCenterText: 'Chat',
          softKeyRightText: '',
          onEnter: (evt, scope) => {
            contactListMenu.$destroy();
            setTimeout(async () => {
              if (scope.selected) {
                let chat = [...chatList, ...archivedChatList].find(c => scope.selected.id.value.toString() === c.id.value.toString());
                if (chat != null) {
                  openRoom(chat.name, chat);
                } else {
                  let name = '';
                  if (scope.selected.firstName)
                    name = scope.selected.firstName;
                  if (scope.selected.lastName)
                    name += ' ' + scope.selected.lastName;
                  if (name === '' && scope.selected.username)
                    name = scope.selected.username;
                  else if (name === '' && scope.selected.phone)
                    name = scope.selected.phone;
                  else if (name === '')
                    name = scope.selected.id.value.toString();
                  openRoom(name, { entity: scope.selected });
                }
              }
            }, 100);
          },
          onBackspace: (evt, scope) => {
            evt.preventDefault();
            evt.stopPropagation();
            contactListMenu.$destroy();
          },
          onOpened: () => {
            navInstance.detachListener();
          },
          onClosed: (scope) => {
            navInstance.attachListener();
            contactListMenu = null;
          }
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  async function getSavedContacts() {
    try {
      let result = await client.invoke(new Api.contacts.GetSaved());
      console.log(result);
    } catch (err) {
      if (err.errorMessage === "TAKEOUT_REQUIRED") {
        getContactsFallback();
      }
    }
  }

  async function getSavedContactsFallback() {
    try {
      let result = await client.invoke(new Api.account.InitTakeoutSession({ contacts: true }));
      result = await client.invoke(new Api.InvokeWithTakeout({ takeoutId: result.id, query: new Api.contacts.GetSaved() }));
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  }

  function openAuthorizedMenu() {
    authorizedMenu = new OptionMenu({
      target: document.body,
      props: {
        title: user.length > 0 ? `Hi ${user[0].username}` : 'Menu',
        focusIndex: 0,
        options: [
          { title: 'New Contact' },
          { title: 'Contacts' },
          { title: 'Settings' },
          { title: 'Logout' },
          { title: 'Exit' },
        ],
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {},
        onSoftkeyLeft: (evt, scope) => {},
        onEnter: async(evt, scope) => {
          authorizedMenu.$destroy();
          if (scope.selected.title === 'Contacts') {
            getContacts();
          } else if (scope.selected.title === 'Exit') {
            window.close();
          }
        },
        onBackspace: (evt, scope) => {
          evt.preventDefault();
          evt.stopPropagation();
          authorizedMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          navInstance.attachListener();
          authorizedMenu = null;
        }
      }
    });
  }

  function resetCursor() {
    if (qrModal != null || password2FA != null)
      return
    navInstance.verticalNavIndex = 0;
    setTimeout(() => {
      navInstance.navigateListNav(0);
      setTimeout(() => {
        const cursor = document.getElementsByClassName(navClass)[navInstance.verticalNavIndex];
        if (cursor) {
          cursor.classList.add('focus');
        }
      }, 150)
    }, 150);
  }

  function toastMessage(text = 'I\'m out after 2 second') {
    const t = new Toast({
      target: document.body,
      props: {
        options: {}
      }
    })
    Toaster.push(text , {
      dismissable: false,
      intro: { y: -64 },
      duration: 2000,
      onpop: () => {
        setTimeout(() => {
          t.$destroy();
        }, 4000);
      }
    })
  }

  function showLoadingBar() {
    loadingBar = new LoadingBar({
      target: document.body,
      props: {
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: () => {
          navInstance.attachListener();
          loadingBar = null;
        }
      }
    });
  }

  function onInputPhoneNumber(evt) {
    phoneNumber = evt.target.value.trim().toString();
  }

  function onInputPhoneCode(evt) {
    phoneCode = evt.target.value.trim().toString();
  }

  function onFocus(evt) {
    if (qrModal != null || password2FA != null)
      return
    inputSoftwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: true,
        leftText: '',
        centerText: 'Enter',
        rightText: ''
      }
    });
  }

  function onBlur(evt) {
    if (inputSoftwareKey) {
      inputSoftwareKey.$destroy();
      inputSoftwareKey = null;
    }
  }

  function signIn2FA() {
    password2FA = new TextInputDialog({
      target: document.body,
      props: {
        title: '2FA Password',
        softKeyCenterText: 'ok',
        softKeyRightText: 'Cancel',
        value: '',
        placeholder: 'Password',
        type: 'text',
        onSoftkeyLeft: (evt, value) => {},
        onSoftkeyRight: (evt, value) => {
          password2FA.$destroy();
        },
        onEnter: async (evt, password) => {
          try {
            showLoadingBar();
            const result = await client.signInWithPassword(
              {
                apiId: TelegramKeyHash.api_id,
                apiHash: TelegramKeyHash.api_hash,
              },
              {
                password: (hint) => {
                  return Promise.resolve(password);
                },
                onError: (err) => {
                  if (loadingBar) {
                    loadingBar.$destroy();
                  }
                  console.log(err);
                }
              }
            );
            console.log(result);
            if (loadingBar) {
              loadingBar.$destroy();
            }
            isUserAuthorized();
            resetCursor();
            phoneCodeHash = null;
            password2FA.$destroy();
          } catch (err) {
            if (loadingBar) {
              loadingBar.$destroy();
            }
            console.log(err);
          }
        },
        onBackspace: (evt, value) => {
          evt.stopPropagation();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (value) => {
          navInstance.attachListener();
          password2FA = null;
        }
      }
    });

  }

  function sign_up() {}

  async function signIn() {
    try {
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: phoneCodeHash,
          phoneCode: phoneCode,
        })
      );
      console.log(result);
      isUserAuthorized();
      resetCursor();
      phoneCodeHash = null;
    } catch (err) {
      if (err.errorMessage !== 'SESSION_PASSWORD_NEEDED') {
        console.log(err);
        return;
      }
      signIn2FA();
    }
  }

  async function send_code() {
    try {
      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phoneNumber,
          apiId: TelegramKeyHash.api_id,
          apiHash: TelegramKeyHash.api_hash,
          settings: new Api.CodeSettings({
            allowFlashcall: true,
            currentNumber: true,
            allowAppHash: true,
          }),
        })
      );
      phoneCodeHash = result.phoneCodeHash;
      resetCursor();
    } catch (err) {
      console.log(err);
    }
  }

  function signInQR() {
    setTimeout(() => {
      qrModal = new QRModal({
        target: document.body,
        props: {
          title: 'Log-In via QR Code',
          onBackspace: (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            qrModal.$destroy();
          },
          onOpened: () => {
            navInstance.detachListener();
          },
          onClosed: () => {
            navInstance.attachListener();
            qrModal = null;
          }
        }
      });
    }, 100);
  }

  async function importLoginToken(token) {
    try {
      const result = await client.invoke(
        new Api.auth.ImportLoginToken({
          token: token, //Buffer.from("arbitrary data here"),
        })
      );
      console.log(result);
      isUserAuthorized();
      phoneCodeHash = null;
    } catch (err) {
      console.log(err);
    }
  }

  async function exportLoginToken() {
    try {
      const result = await client.invoke(
        new Api.auth.ExportLoginToken({
          apiId: TelegramKeyHash.api_id,
          apiHash: TelegramKeyHash.api_hash,
          exceptIds: [],
        })
      );
      console.log(result); // TODO
      //if (result._ === 'auth.loginTokenSuccess') {
        //isUserAuthorized();
        //phoneCodeHash = null;
      //} else if (result._ === 'auth.loginTokenMigrateTo') {
        //importLoginToken(result.token);
      //}
    } catch (err) {
      if (err.errorMessage !== 'SESSION_PASSWORD_NEEDED') {
        console.log(err);
        return;
      }
      signIn2FA();
    }
  }

  function resetSignIn() {
    phoneCodeHash = null;
    resetCursor();
  }

  async function signOut() {
    try {
      const result = await client.invoke(new Api.auth.LogOut({}));
      console.log(result);
      isUserAuthorized();
      phoneCodeHash = null;
    } catch (err) {
      console.log(err);
    }
  }

  function sortChats(chats) {
    try {
      archivedChatListName = [];
      archivedChatList = [];
      let tempChatList = [];
      chats.forEach((chat, index) => {
        if (chat.archived) {
          if (archivedChatListName.length !== 3) {
            archivedChatListName.push(chat.name);
            if (archivedChatListName.length === 2)
              archivedChatListName.push('more...')
          }
          archivedChatList.push(chat);
        } else {
          tempChatList.push(chat);
        }
      });
      chatList = tempChatList;
      //setTimeout(() => {
        //navInstance.navigateListNav(1);
        //setTimeout(() => {
          //navInstance.navigateListNav(-1);
        //}, 100);
        //console.log(1);
      //}, 100);
    } catch(err) {
      console.log(err.toString());
    }
  }

  async function openRoom(name, chat) {
    let scrollAt;
    try {
      let pref = await (await cachedDatabase).get('chatPreferences', chat.entity.id.value.toString());
      scrollAt = pref['scrollAt'];
    } catch(err) {}
    goto('room', { state: { name, entity: chat.entity.toJSON(), scrollAt } });

  }

  function eventHandler(evt) {
    if (evt.className === "UpdateLoginToken") {
      exportLoginToken();
      if (qrModal) {
        qrModal.$destroy();
      }
    }
  }

  function getThumb(chat) {
    if (chat.entity.__isSavedMessages) {
      return `<img alt="icon" style="background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="/icons/saved.png"/>`
    }
    if (thumbs[chat.iconRef]) {
      return `<img alt="icon" style="background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;"" src="${thumbs[chat.iconRef]}"/>`;
    }
    return `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;font-weight:bold;color:#fff;background-color:var(--themeColor);width:40px;height:40px;border-radius:50%;box-sizing:border-box;border: 2px solid #fff;">${chat.name.split(' ').map(text => text[0]).splice(0, 2).join('')}</div>`;
  }

  function runWorker() {
    if (window['web_worker'])
      window['web_worker'].terminate();
    const script = `
      importScripts('${window.location.origin}/js/telegram.js');
      importScripts('${window.location.origin}/js/polyfill.min.js');

      let clients;

      function retrieveChats() {
        client.getDialogs({
          offsetPeer: new telegram.Api.InputPeerSelf(),
          limit: 100,
          excludePinned: true,
          folderId: 0,
        })
        .then((chats) => {
          //self.postMessage({ type: 1, params: chats });
        })
        .catch(err => {
          //self.postMessage({ type: -1, params: err });
        });
      }

      self.onmessage = function(e) {
        switch (e.data.type) {
          case 0:
            const session = new telegram.sessions.MemorySession();
            session.setDC(e.data.params.dcId, e.data.params.serverAddress, e.data.params.port);
            session.setAuthKey(new telegram.AuthKey(e.data.params.authKey._key, e.data.params.authKey._hash), e.data.params.dcId);
            client = new telegram.TelegramClient(session, ${TelegramKeyHash.api_id}, '${TelegramKeyHash.api_hash}', {
              maxConcurrentDownloads: 1,
            });
            client.connect()
            .then(() => {
              self.postMessage({ type: 0, params: 1 });
            })
            .catch(err => {
              self.postMessage({ type: -1, params: err });
            });
            break;
          case 1:
            break;
        }
      }
    `;
    const blob = new Blob([script], {type: 'application/javascript'});
    const worker = new Worker(URL.createObjectURL(blob));
    worker.postMessage({
      type: 0,
      params: {
        dcId: session.dcId,
        serverAddress: session.serverAddress,
        port: session.port,
        authKey: session.getAuthKey(session.dcId)
      }
    });
    return worker;
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(name);
    softwareKey.setText({ left: '', center: 'SELECT', right: '' });
    navInstance.attachListener();

    client.addEventHandler(eventHandler);

    unchatCollections = chatCollections.subscribe(chats => {
      if (client.connected) {
        sortChats(chats);
        window['web_worker'] = runWorker();
        window['web_worker'].onmessage = (e) => {
          switch (e.data.type) {
            case -1:
              console.log('Err', e.data.params);
              break;
            case 0:
              console.log('Connected to web worker');
              break;
          }
        }
      }
    });

    unconnectionStatus = connectionStatus.subscribe(status => {
      // console.log(status);
    });

    unauthorizedStatus = authorizedStatus.subscribe(status => {
      authStatus = status;
      if (status) {
        softwareKey.setLeftText('Menu');
        softwareKey.setRightText('Search');
        if (inputSoftwareKey) {
          inputSoftwareKey.$destroy();
          inputSoftwareKey = null;
        }
        if (qrModal) {
          qrModal.$destroy();
          qrModal = null;
        }
        if (password2FA) {
          password2FA.$destroy();
          password2FA = null;
        }
      } else {
        softwareKey.setLeftText('');
        softwareKey.setRightText('');
      }
    });

    uncachedThumbnails = cachedThumbnails.subscribe(data => {
      thumbs = data;
      chatList = [...chatList];
    });

    unauthorizedUser = authorizedUser.subscribe(data => {
      user = data;
    });

  });

  onDestroy(() => {
    client.removeEventHandler(eventHandler);
    navInstance.detachListener();
    if (unchatCollections)
      unchatCollections();
    if (unauthorizedStatus)
      unauthorizedStatus();
    if (unconnectionStatus)
      unconnectionStatus();
    if (uncachedThumbnails)
      uncachedThumbnails();
    if (unauthorizedUser)
      unauthorizedUser();
  });

</script>

<main id="home-screen" data-pad-top="28" data-pad-bottom="30">
  {#if authStatus === false }
  {#if phoneCodeHash === null}
  <TextInputField className="{navClass}" label="Phone Number" placeholder="Phone Number" value={phoneNumber} type="tel" onInput="{onInputPhoneNumber}" {onFocus} {onBlur} />
  <Button className="{navClass}" text="Send Code" onClick={send_code}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Log-In via QR Code" onClick={signInQR}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {:else}
  <TextInputField className="{navClass}" label="Login Code" placeholder="Login Code" value={phoneCode} type="tel" onInput="{onInputPhoneCode}" {onFocus} {onBlur} />
  <Button className="{navClass}" text="Sign In" onClick={signIn}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Return" onClick={resetSignIn}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {/if}
  <Button className="{navClass}" text="Exit" onClick={() => window.close() }>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {:else}
  {#if archivedChatList.length > 0 }
    <ListView className="{navClass}" title="Archived Chats" subtitle="{archivedChatListName.join(', ').substring(0, 50)}" onClick={openArchivedChatListMenu}>
      <span slot="leftWidget" style="padding-right: 4px;"><img alt="icon" style="background-color:var(--themeColor);width:40px;height:40px;box-sizing:border-box;border-radius:50%;border: 2px solid #fff;" src="/icons/archived.png"/></span>
    </ListView>
  {/if}
  {#each chatList as chat}
    <ChatListView userId={user.length > 0 ? user[0].id.value.toString() : null} chat={chat} className="{navClass}" icon={getThumb(chat)} onClick={() => openRoom(chat.name, chat)} />
  {/each}
  {/if}
</main>

<style>
  #home-screen {
    overflow: scroll;
    overflow-x: hidden;
    width: 100%;
  }
</style>
