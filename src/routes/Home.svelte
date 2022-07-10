<script lang="ts">
  import { Route, navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { ListView, LoadingBar, Button, TextInputField, Toast, Toaster, SoftwareKey, TextInputDialog } from '../components';
  import { onMount, onDestroy } from 'svelte';

  import { api, bigInt } from '../utils/mtproto_client';
  import { concatBytes, bigIntToBytes, bytesToBigInt } from '@mtproto/core/src/utils/common';
  import QRModal from './QRModal.svelte';

  import TelegramKeyHash from '../telegram_key';

  const { Api, TelegramClient } = telegram;
  const { StoreSession } = telegram.sessions;
  const session = new StoreSession("gramjs");
  let client: typeof TelegramClient;

  const navClass: string = 'homeNav';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let loadingBar: LoadingBar;
  let inputSoftwareKey: SoftwareKey;
  let qrModal: QRModal;
  let password2FA: TextInputDialog;

  let name: string = 'Home';
  let phoneNumber = '+9996611077';
  let phoneCode = '11111';
  let phoneCodeHash = null;
  let qrCode = null;
  let authStatus: boolean = false;

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (inputSoftwareKey || qrModal|| password2FA)
        return;
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

  // https://github.com/alik0211/mtproto-core/issues/180
  async function set_password() {};

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
            const result = client.signInWithPassword(
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
            if (result)
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
      console.log(result); // prints the result
    } catch (err) {
      if (err.errorMessage !== 'SESSION_PASSWORD_NEEDED') {
        console.log('error:', err);
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

  function import_login_token(token) {
    api.call('auth.importLoginToken', { token: token })
    .then(result => {
      // console.log(result);
      get_user();
    })
    .catch(err => {
      console.log(err);
    });
  }

  function export_login_token() {
    api.call('auth.exportLoginToken', {
      api_id: api.mtproto.api_id,
      api_hash: api.mtproto.api_hash,
      except_ids: [],
    })
    .then(result => {
      // console.log(result);
      if (result._ === 'auth.loginTokenSuccess') {
        get_user();
      } else if (result._ === 'auth.loginTokenMigrateTo') {
        import_login_token(result.token);
      }
    })
    .catch(err => {
      if (err.error_message !== 'SESSION_PASSWORD_NEEDED') {
        console.log('error:', err);
        return;
      }
      sign_in_2fa();
    });
  }

  function reset_sign_in() {
    phoneCodeHash = null;
    reset_cursor();
  }

  function sign_out() {}

  function get_user() {}

  async function get_chats() {}

  onMount(() => {
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(name);
    softwareKey.setText({ left: '', center: 'SELECT', right: '' });
    navInstance.attachListener();

    //........
    client = new TelegramClient(session, parseInt(TelegramKeyHash.api_id), TelegramKeyHash.api_hash);
    client.connect();

  });

  onDestroy(() => {
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
  {:else}
  <Button className="{navClass}" text="Get Chats" onClick={get_chats}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Set Password" onClick={set_password}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Logout" onClick={sign_out}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {/if}
  <Button className="{navClass}" text="Exit" onClick={onButtonClick}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
</main>

<style>
  #home-screen {
    overflow: scroll;
    width: 100%;
  }
</style>
