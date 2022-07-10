<script lang="ts">
  import { Route, navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { ListView, LoadingBar, Button, TextInputField, Toast, Toaster, SoftwareKey, TextInputDialog, OptionMenu } from '../components';
  import { onMount, onDestroy } from 'svelte';

  import { TelegramKeyHash, Api, client } from '../utils/mtproto_client';
  import QRModal from '../widgets/QRModal.svelte';

  const navClass: string = 'homeNav';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let loadingBar: LoadingBar;
  let inputSoftwareKey: SoftwareKey;
  let qrModal: QRModal;
  let password2FA: TextInputDialog;
  let optionMenu: OptionMenu;

  let name: string = 'Telekram';
  let phoneNumber = '+9996611077';
  let phoneCode = '11111';
  let phoneCodeHash = null;
  let qrCode = null;
  let authStatus: boolean = false;
  let archivedList = [];
  let archivedListName = [];
  let chatList = [];

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (inputSoftwareKey || qrModal|| password2FA)
        return;
      if (authStatus)
        openOptionMenu();
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

  function openOptionMenu() {
    optionMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Menu',
        focusIndex: 0,
        options: [
          { title: 'Logout' },
          { title: 'Exit' },
        ],
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
        },
        onSoftkeyLeft: (evt, scope) => {
          console.log('onSoftkeyRight', scope);
        },
        onEnter: (evt, scope) => {
          console.log('onEnter', scope);
          optionMenuIndex = scope.index;
          optionMenu.$destroy();
        },
        onBackspace: (evt, scope) => {
          console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          optionMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          console.log(scope);
          navInstance.attachListener();
          optionMenu = null;
        }
      }
    });
  }

  function reset_cursor() {
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
          //setTimeout(() => {
          //  loadingBar.$destroy();
          //}, 3000);
        },
        onClosed: () => {
          navInstance.attachListener();
          loadingBar = null;
        }
      }
    });
  }

  function onButtonClick(evt) {
    window.close();
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

  function propagateClick(evt) {
    const keys = Object.keys(evt.target.children);
    for (var k in keys) {
      evt.target.children[k].click();
    }
  }

  function sign_in_2fa() {
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
                apiId: parseInt(TelegramKeyHash.api_id),
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
            is_user_authorized();
            reset_cursor();
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

  async function sign_in() {
    try {
      const result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: phoneCodeHash,
          phoneCode: phoneCode,
        })
      );
      console.log(result);
      is_user_authorized();
      reset_cursor();
      phoneCodeHash = null;
    } catch (err) {
      if (err.errorMessage !== 'SESSION_PASSWORD_NEEDED') {
        console.log(err);
        return;
      }
      sign_in_2fa();
    }
  }

  async function send_code() {
    try {
      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phoneNumber,
          apiId: parseInt(TelegramKeyHash.api_id),
          apiHash: TelegramKeyHash.api_hash,
          settings: new Api.CodeSettings({
            allowFlashcall: true,
            currentNumber: true,
            allowAppHash: true,
          }),
        })
      );
      phoneCodeHash = result.phoneCodeHash;
      reset_cursor();
    } catch (err) {
      console.log(err);
    }
  }

  function sign_in_qr() {
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

  async function import_login_token(token) {
    try {
      const result = await client.invoke(
        new Api.auth.ImportLoginToken({
          token: token, //Buffer.from("arbitrary data here"),
        })
      );
      console.log(result);
      is_user_authorized();
      phoneCodeHash = null;
    } catch (err) {
      console.log(err);
    }
  }

  async function export_login_token() {
    try {
      const result = await client.invoke(
        new Api.auth.ExportLoginToken({
          apiId: parseInt(TelegramKeyHash.api_id),
          apiHash: TelegramKeyHash.api_hash,
          exceptIds: [],
        })
      );
      console.log(result);
      //if (result._ === 'auth.loginTokenSuccess') {
        //is_user_authorized();
        //phoneCodeHash = null;
      //} else if (result._ === 'auth.loginTokenMigrateTo') {
        //import_login_token(result.token);
      //}
    } catch (err) {
      if (err.errorMessage !== 'SESSION_PASSWORD_NEEDED') {
        console.log(err);
        return;
      }
      sign_in_2fa();
    }
  }

  function reset_sign_in() {
    phoneCodeHash = null;
    reset_cursor();
  }

  async function sign_out() {
    try {
      const result = await client.invoke(new Api.auth.LogOut({}));
      console.log(result);
      is_user_authorized();
      phoneCodeHash = null;
    } catch (err) {
      console.log(err);
    }
  }

  async function is_user_authorized() {
    const { softwareKey } = getAppProp();
    try {
      const authorized = await client.isUserAuthorized();
      authStatus = false;
      if (authorized) {
        authStatus = authorized;
        get_chats();
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
    } catch (err) {
      console.log(err);
    }
  }

  async function get_user() {
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

  async function get_chats() {
    try {
      const user = await get_user();
      const chats = await client.getDialogs({
        offsetPeer: user[0].username,
        limit: 100,
        excludePinned: true,
        folderId: 0,
      });
      archivedList = [];
      archivedListName = [];
      chatList = [];
      chats.forEach(chat => {
        if (chat.id.value === user[0].id.value) {
          chat.name = 'Saved Messages';
        }
        if (chat.archived) {
          archivedList.push(chat);
          archivedListName.push(chat.name);
        } else {
          chatList.push(chat);
        }
      });
      // console.log(chatList);
      // console.log(archivedList);
      // const savedMessages = await client.getMessages("me");
      // console.log(savedMessages);
      reset_cursor();
    } catch(err) {
      console.log(err);
    }
  }

  function eventHandler(evt) {
    if (evt.className === "UpdateLoginToken") {
      export_login_token();
      if (qrModal) {
        qrModal.$destroy();
      }
    } else {
      console.log(evt);
    }
  }

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(name);
    softwareKey.setText({ left: '', center: 'SELECT', right: '' });
    navInstance.attachListener();

    client.addEventHandler(eventHandler);
    client.connect()
    .then(() => {
      return client.isUserAuthorized();
    })
    .then((authorized) => {
      is_user_authorized();
      reset_sign_in();
    })
    .catch((err) => {
      console.log(err);
    });

  });

  onDestroy(() => {
    client.removeEventHandler(eventHandler);
    navInstance.detachListener();
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
  <Button className="{navClass}" text="Log-In via QR Code" onClick={sign_in_qr}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {:else}
  <TextInputField className="{navClass}" label="Login Code" placeholder="Login Code" value={phoneCode} type="tel" onInput="{onInputPhoneCode}" {onFocus} {onBlur} />
  <Button className="{navClass}" text="Sign In" onClick={sign_in}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Return" onClick={reset_sign_in}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {/if}
  <Button className="{navClass}" text="Exit" onClick={onButtonClick}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {:else}
  {#each chatList as chat}
    {#if archivedList.length > 0 }
      <ListView className="{navClass}" title="Archived Chats" subtitle="{archivedListName.join(', ').substring(0, 50)}" onClick={() => console.log(archivedList)}/>
    {/if}
    <ListView className="{navClass}" title="{chat.name + (chat.unreadCount ? '(' + chat.unreadCount + ')' : '')}" subtitle="{chat.message.message.substring(0, 50)}" onClick={() => console.log(chat)}/>
  {/each}
  {/if}
</main>

<style>
  #home-screen {
    overflow: scroll;
    width: 100%;
  }
</style>
