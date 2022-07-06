<script lang="ts">
  import { Route, navigate as goto } from "svelte-navigator";
  import { createKaiNavigator } from '../utils/navigation';
  import { Dialog, OptionMenu, ListView, Separator, LoadingBar, Button, TextInputField, Toast, Toaster, SoftwareKey } from '../components';
  import { onMount, onDestroy } from 'svelte';

  import { api, bigInt } from '../utils/mtproto_client';
  import { concatBytes, bigIntToBytes, bytesToBigInt } from '@mtproto/core/src/utils/common';
  import QRModal from './QRModal.svelte';

  const navClass: string = 'homeNav';

  export let location: any;
  export let navigate: any;
  export let getAppProp: Function;

  let dialog: Dialog;
  let optionMenu: OptionMenu;
  let optionMenuIndex: number = 0;
  let loadingBar: LoadingBar;
  let inputSoftwareKey: SoftwareKey;
  let localeMenu: OptionMenu;
  let qrModal: QRModal;

  let locale: string;
  let name: string = 'Home';
  let locales:any = [
    { title: 'English - United State', subtitle: 'en-US' },
    { title: 'Japanese', subtitle: 'jp-JP' },
  ];
  let phoneNumber = '+9996611077';
  let phoneCode = '11111';
  let phoneCodeHash = null;
  let qrCode = null;
  let authStatus: boolean = false;

  let navOptions = {
    verticalNavClass: navClass,
    softkeyLeftListener: function(evt) {
      if (inputSoftwareKey)
        return;
      openDialog();
      // console.log('softkeyLeftListener', name, this.verticalNavIndex);
    },
    softkeyRightListener: function(evt) {
      if (inputSoftwareKey)
        return;
      toastMessage();
      // console.log('softkeyRightListener', name, this.verticalNavIndex);
    },
    enterListener: function(evt) {
      if (inputSoftwareKey)
        return;
      const navClasses = document.getElementsByClassName(navClass);
      if (navClasses[this.verticalNavIndex] != null) {
        navClasses[this.verticalNavIndex].click();
      }
      // console.log('enterListener', name);
    },
    backspaceListener: function(evt) {
      // console.log('backspaceListener', name);
    },
    arrowLeftListener: function(evt) {
      // console.log('arrowLeftListener', name);
    },
    arrowRightListener: function(evt) {
      // console.log('arrowRightListener', name);
    },
  };

  let navInstance = createKaiNavigator(navOptions);

  function onClickHandler(value) {
    goto(value);
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

  function openDialog() {
    dialog = new Dialog({
      target: document.body,
      props: {
        title: 'Intro',
        body: `Svelte is a radical new approach to building user interfaces. Whereas traditional frameworks like React and Vue do the bulk of their work in the browser, Svelte shifts that work into a compile step that happens when you build your app. Instead of using techniques like virtual DOM diffing, Svelte writes code that surgically updates the DOM when the state of your app changes. We're proud that Svelte was recently voted the most loved web framework with the most satisfied developers in a pair of industry surveys. We think you'll love it too. Read the introductory blog post to learn more.`,
        softKeyCenterText: 'hide',
        onSoftkeyLeft: (evt) => {
          // console.log('onSoftkeyLeft');
        },
        onSoftkeyRight: (evt) => {
          // console.log('onSoftkeyRight');
        },
        onEnter: (evt) => {
          // console.log('onEnter');
          dialog.$destroy();
        },
        onBackspace: (evt) => {
          // console.log('onBackspace');
          evt.preventDefault();
          evt.stopPropagation();
          dialog.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: () => {
          navInstance.attachListener();
          dialog = null;
        }
      }
    });
  }

  function openOptionMenu() {
    optionMenu = new OptionMenu({
      target: document.body,
      props: {
        title: 'Option Menu',
        focusIndex: optionMenuIndex,
        options: [
          { title: 'Option Menu 0', subtitle: 'Option menu 0 subtitle' },
          { title: 'Option Menu 1', subtitle: 'Option menu 1 subtitle' },
          { title: 'Option Menu 2', subtitle: 'Option menu 2 subtitle' },
          { title: 'Option Menu 3', subtitle: 'Option menu 3 subtitle' },
          { title: 'Option Menu 4', subtitle: 'Option menu 4 subtitle' },
        ],
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {
          // console.log('onSoftkeyRight', scope);
        },
        onSoftkeyLeft: (evt, scope) => {
          // console.log('onSoftkeyRight', scope);
        },
        onEnter: (evt, scope) => {
          // console.log('onEnter', scope);
          optionMenuIndex = scope.index;
          optionMenu.$destroy();
        },
        onBackspace: (evt, scope) => {
          // console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          optionMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          // console.log(scope);
          navInstance.attachListener();
          optionMenu = null;
        }
      }
    });
  }

  function onButtonClick(evt) {
    window.close();
  }

  function onInput(evt) {
    // console.log('onInput');
  }

  function onFocus(evt) {
    if (qrModal != null)
      return
    // console.log('onFocus');
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
    // console.log('onBlur');
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

  function changeLocale() {
    const idx = locales.findIndex((o) => {
      return o.subtitle === locale || 0;
    })
    localeMenu = new OptionMenu({
      target: document.body,
      props: {
        title: getAppProp().localization.lang('select_locale'),
        focusIndex: idx,
        options: locales,
        softKeyCenterText: 'select',
        onSoftkeyRight: (evt, scope) => {
          // console.log('onSoftkeyRight', scope);
        },
        onSoftkeyLeft: (evt, scope) => {
          // console.log('onSoftkeyRight', scope);
        },
        onEnter: (evt, scope) => {
          // console.log('onEnter', scope);
          getAppProp().localization.loadLocale(scope.selected.subtitle);
          locale = getAppProp().localization.defaultLocale;
          localeMenu.$destroy();
        },
        onBackspace: (evt, scope) => {
          // console.log('onBackspace', scope);
          evt.preventDefault();
          evt.stopPropagation();
          localeMenu.$destroy();
        },
        onOpened: () => {
          navInstance.detachListener();
        },
        onClosed: (scope) => {
          // console.log(scope);
          navInstance.attachListener();
          localeMenu = null;
        }
      }
    });
  }

  function get_user() {
    api.call('users.getFullUser', {
      id: {
        _: 'inputUserSelf',
      },
    })
    .then(user => {
      console.log(user);
      authStatus = true;
    })
    .catch(err => {
      console.log(err);
      authStatus = false;
    })
    .finally(() => {
      phoneCodeHash = null;
      reset_cursor();
    });
  }

  // https://github.com/alik0211/mtproto-core/issues/180
  async function set_password() {

    let oldPass = prompt('oldPass')
    let newPass = prompt('newPass')

    if (oldPass === newPass)
      return;

    const psetting = await api.call('account.getPassword');
    if (psetting.has_password && !oldPass)
      return;

    const { new_algo, srp_id, srp_B, current_algo } = psetting;

    let inputCheckPasswordSRP = { _: 'inputCheckPasswordEmpty' };

    if (psetting.has_password) {
      const { A, M1 } = await api.mtproto.crypto.getSRPParams({ ...current_algo, gB: srp_B, password: oldPass });
      inputCheckPasswordSRP = { _: 'inputCheckPasswordSRP', srp_id, A, M1 };
    }

    new_algo.salt1 = concatBytes(new_algo.salt1, api.mtproto.envMethods.getRandomBytes(24));

    const { SHA256, PBKDF2 } = api.mtproto.crypto;
    const SH = (data, salt) => SHA256(concatBytes(salt, data, salt));
    const PH1 = async (password, salt1, salt2) => SH(await SH(password, salt1), salt2);
    const PH2 = async (password, salt1, salt2) => SH(await PBKDF2(await PH1(password, salt1, salt2), salt1, 100000), salt2);

    const encoder = new TextEncoder();

    const gBigInt = bigInt(new_algo.g);
    const pBigInt = bytesToBigInt(new_algo.p);

    const x = await PH2(encoder.encode(newPass), new_algo.salt1, new_algo.salt2);
    const xBigInt = bytesToBigInt(x);
    const vBigInt = gBigInt.modPow(xBigInt, pBigInt);

    const V = bigIntToBytes(vBigInt);

    const passwordInputSettings = { _: 'account.passwordInputSettings', new_algo, new_password_hash: V, hint: 'who i am' };

    // console.log({ password: inputCheckPasswordSRP, new_settings: passwordInputSettings });

    return await api.call('account.updatePasswordSettings', { password: inputCheckPasswordSRP, new_settings: passwordInputSettings });
  };

  function check_password({ srp_id, A, M1 }) {
    return api.call('auth.checkPassword', {
      password: {
        _: 'inputCheckPasswordSRP',
        srp_id,
        A,
        M1,
      },
    });
  }

  async function sign_in_2fa(password) {
    const { srp_id, current_algo, srp_B } = await api.call('account.getPassword');
    const { g, p, salt1, salt2 } = current_algo;
    const { A, M1 } = await api.mtproto.crypto.getSRPParams({ g, p, salt1, salt2, gB: srp_B, password });
    return await check_password({ srp_id, A, M1 });
  }

  // redirect sign_up page
  function sign_up() {
    return
    api.call('auth.signUp', {
      phone_number: phoneNumber,
      phone_code_hash: phoneCodeHash,
      first_name: 'MTProto',
      last_name: 'Core',
    })
    .then(result => {
      send_code();
    })
    .catch(err => {
      console.log(err);
    });
  }

  function sign_in() {
    api.call('auth.signIn', {
      phone_code: phoneCode,
      phone_number: phoneNumber,
      phone_code_hash: phoneCodeHash,
    })
    .then(result => {
      if (result._ === 'auth.authorizationSignUpRequired') {
        sign_up();
        return
      } else if (result._ === 'auth.authorization' && result.setup_password_required) {
        console.log(result);
      } else {
        console.log(result.user);
      }
      get_user();
    })
    .catch(err => {
      if (err.error_message !== 'SESSION_PASSWORD_NEEDED') {
        console.log('error:', err);
        return;
      }
      showLoadingBar();
      sign_in_2fa(prompt('password'))
      .then((result) => {
        console.log(result);
        get_user();
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        if (loadingBar) {
          loadingBar.$destroy();
        }
      })
    });
  }

  function send_code() {
    api.call('auth.sendCode', {
      phone_number: phoneNumber,
      settings: {
        _: 'codeSettings',
      },
    })
    .then(result => {
      console.log('auth.sendCode:', result);
      phoneCodeHash = result.phone_code_hash;
      reset_cursor();
    })
    .catch(err => {
      console.log(err);
    });
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
      console.log(result);
      get_user();
    })
    .catch(err => {
      console.log(err);
    });
  }

  function export_login_token() {
    api.call('auth.exportLoginToken', {
      api_id: '1403915',
      api_hash: '1291d66d65b509ed6d5fce437185a8cc',
      except_ids: [],
    })
    .then(result => {
      console.log(result);
      if (result._ === 'auth.loginTokenSuccess') {
        get_user();
      } else if (result._ === 'auth.loginTokenMigrateTo') {
        import_login_token(result.token);
      }
    })
    .catch(err => {
      console.log(err);
    });
  }

  function sign_out() {
    api.call('auth.logOut')
    .finally(() => {
      get_user();
    });
  }

  function reset_cursor() {
    if (qrModal != null)
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

  onMount(() => {
    console.log('onMount', name);
    locale = getAppProp().localization.defaultLocale;
    const { appBar, softwareKey } = getAppProp();
    appBar.setTitleText(name);
    softwareKey.setText({ left: `Dialog L`, center: `${name} C`, right: `Toast R` });
    navInstance.attachListener();

    api.call('help.getNearestDc')
    .then(result => {
      console.log('country:', result.country);
    })
    .catch(err => {
      console.log(err);
    });

    get_user();

    api.mtproto.updates.on('updateShort', (updateInfo) => {
      if (updateInfo.update && updateInfo.update._ === "updateLoginToken") {
        console.log(updateInfo.update);
        export_login_token();
      }
    });

  });

  onDestroy(() => {
    // console.log('onDestroy', name);
    navInstance.detachListener();
  });

</script>

<main id="home-screen" data-pad-top="28" data-pad-bottom="30">
  {#if authStatus === false }
  {#if phoneCodeHash === null}
  <TextInputField className="{navClass}" label="Phone Number" placeholder="Phone Number" value={phoneNumber} type="tel" {onInput} {onFocus} {onBlur} />
  <Button className="{navClass}" text="Send Code" onClick={send_code}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Log-In via QR Code" onClick={sign_in_qr}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {:else}
  <TextInputField className="{navClass}" label="Login Code" placeholder="Login Code" value={phoneCode} type="tel" {onInput} {onFocus} {onBlur} />
  <Button className="{navClass}" text="Sign In" onClick={sign_in}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {/if}
  {:else}
  <Button className="{navClass}" text="Set Password" onClick={set_password}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  <Button className="{navClass}" text="Logout" onClick={sign_out}>
    <span slot="leftWidget" class="kai-icon-arrow" style="margin:0px 5px;-moz-transform: scale(-1, 1);-webkit-transform: scale(-1, 1);-o-transform: scale(-1, 1);-ms-transform: scale(-1, 1);transform: scale(-1, 1);"></span>
    <span slot="rightWidget" class="kai-icon-arrow" style="margin:0px 5px;"></span>
  </Button>
  {/if}
  <ListView className="{navClass}" title="{getAppProp().localization.langByLocale('hello', locale, 'Svelte')}" subtitle="Goto room screen" onClick={() => onClickHandler('room')}/>
  <ListView className="{navClass}" title="{getAppProp().localization.langByLocale('change_locale', locale)}" subtitle="{getAppProp().localization.langByLocale('change_locale_subtitle', locale)}" onClick={changeLocale}/>
  <Separator title="Dialog" />
  <ListView className="{navClass}" title="Option Menu" subtitle="Click to open option menu & focus on index {optionMenuIndex}" onClick={openOptionMenu}/>
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
