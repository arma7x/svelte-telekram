<script lang="ts">
  import { Route, navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { ListView, LoadingBar, Button, TextInputField, Toast, Toaster, SoftwareKey, TextInputDialog, OptionMenu } from '../components';
  import { onMount, onDestroy } from 'svelte';

  import { TelegramKeyHash, Api, client, session, profilePhotoDb } from '../utils/mtproto_client';
  import QRModal from '../widgets/QRModal.svelte';

  import { connectionStatus, authorizedStatus, isUserAuthorized, chatCollections, retrieveChats } from '../stores/telegram';

  const navClass: string = 'homeNav';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let loadingBar: LoadingBar;
  let inputSoftwareKey: SoftwareKey;
  let qrModal: QRModal;
  let password2FA: TextInputDialog;
  let authorizedMenu: OptionMenu;
  let archivedChatListMenu: OptionMenu;

  let unchatCollections;
  let unauthorizedStatus;
  let unconnectionStatus;

  const tempThumb: string = 'data:image/jpeg;base64,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';
  let name: string = 'Telekram';
  let phoneNumber = '';
  let phoneCode = '';
  let phoneCodeHash = null;
  let qrCode = null;
  let authStatus: boolean = false;
  let archivedChatList = [];
  let archivedChatListName = [];
  let _chatList = [];
  let fetchThumbJobs = [];

  $: chatList = _chatList;

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
    archivedChatListMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Archived Chats',
        focusIndex: 0,
        options: archivedChatList,
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
            goto('room', { state: { name: scope.selected.name, entity: scope.selected.entity.toJSON() } });
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
          console.log(scope);
          navInstance.attachListener();
          archivedChatListMenu = null;
        }
      }
    });
  }

  function openAuthorizedMenu() {
    authorizedMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Menu',
        focusIndex: 0,
        options: [
          { title: 'Clear profilePhotoDb' },
          { title: 'New Contact' },
          { title: 'Contact' },
          { title: 'Settings' },
          { title: 'Logout' },
          { title: 'Exit' },
        ],
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {},
        onSoftkeyLeft: (evt, scope) => {},
        onEnter: (evt, scope) => {
          if (scope.selected.title === 'Exit') {
            window.close();
          } else if (scope.selected.title === 'Clear profilePhotoDb') {
            profilePhotoDb.clear();
          }
          authorizedMenu.$destroy();
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
      console.log(result);
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

  async function getUser() {
    try {
      const result = await client.invoke(
        new Api.users.GetUsers({
          id: [new Api.InputPeerSelf()],
        })
      );
      return result;
    } catch (err) {
      console.log(err);
    }
  }

  function runTask(chats, cached) {
    return;
    if (chats.length === 0) {
      _chatList.forEach(chat => {
        if (chat.entity.photo && chat.entity.photo.photoId) {
          if (cached[chat.entity.photo.photoId]) {
            chat.icon = `<img alt="icon" style="width:40px;height:40px;border-radius:50%;" src="${cached[chat.entity.photo.photoId]}"/>`;
          }
        }
      });
      archivedChatList.forEach(chat => {
        if (chat.entity.photo && chat.entity.photo.photoId) {
          if (cached[chat.entity.photo.photoId]) {
            chat.icon = `<img alt="icon" style="width:40px;height:40px;border-radius:50%;" src="${cached[chat.entity.photo.photoId]}"/>`;
          }
        }
      });
      chatList = _chatList;
      return;
    }
    const chat = chats[0];
    if (chat.entity.photo && chat.entity.photo.photoId) {
      client.downloadProfilePhoto(chat.entity)
      .then(buffer => {
        const reader = new FileReader();
        reader.onloadend = () => {
          cached[chat.entity.photo.photoId] = reader.result;
          chats.splice(0, 1);
          setTimeout(() => {
            runTask(chats, cached);
          }, 100);
        };
        reader.onerror = (err) => {
          chats.splice(0, 1);
          setTimeout(() => {
            runTask(chats, cached);
          }, 100);
        };
        reader.readAsDataURL(new Blob([new Uint8Array(buffer, 0, buffer.length)], {type : 'image/jpeg'}));
      })
      .catch(err => {
        chats.splice(0, 1);
        setTimeout(() => {
          runTask(chats, cached);
        }, 100);
      });
    } else {
      chats.splice(0, 1);
      setTimeout(() => {
        runTask(chats, cached);
      }, 100);
    }
  }

  async function sortChats(chats) {
    try {
      const user = await getUser();
      archivedChatListName = [];
      archivedChatList = [];
      let tempChatList = [];
      chats.forEach((chat, index) => {
        chat.icon = `<img alt="icon" style="width:40px;height:40px;border-radius:50%;" src="${tempThumb}"/>`;
        if (chat.id.value === user[0].id.value) {
          chat.name = 'Saved Messages';
        }
        if (chat.archived) {
          if (chat.message && chat.message.message)
            chat.subtitle = chat.message.message.substring(0, 50);
          archivedChatListName.push(chat.name);
          archivedChatList.push(chat);
        } else {
          tempChatList.push(chat);
        }
        fetchThumbJobs.push(chat);
      });
      _chatList = tempChatList;
      chatList = _chatList;
      setTimeout(() => {
        navInstance.navigateListNav(1);
        setTimeout(() => {
          navInstance.navigateListNav(-1);
        }, 100);
        console.log(1);
      }, 100);
      runTask(chats, {});
    } catch(err) {
      console.log(err.toString());
    }
  }

  function openRoom(name, entity) {
    goto('room', { state: { name, entity: entity.toJSON() } });
  }

  function eventHandler(evt) {
    if (evt.className === "UpdateLoginToken") {
      exportLoginToken();
      if (qrModal) {
        qrModal.$destroy();
      }
    }
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
      }
    });

    unconnectionStatus = connectionStatus.subscribe(status => {
      console.log(status);
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
      <span slot="leftWidget" style="padding-right: 4px;"><img alt="icon" style="width:40px;height:40px;border-radius:50%;" src="{tempThumb}"/></span>
    </ListView>
  {/if}
  {#each chatList as chat}
    <ListView className="{navClass}" title="{chat.name + (chat.unreadCount ? '(' + chat.unreadCount + ')' : '')}" subtitle="{chat.message.message.substring(0, 50)}" onClick={() => openRoom(chat.name, chat.entity)}>
      <span slot="leftWidget" style="padding-right: 4px;">{@html chat.icon || ''}</span>
    </ListView>
  {/each}
  {/if}
</main>

<style>
  #home-screen {
    overflow: scroll;
    width: 100%;
  }
</style>
