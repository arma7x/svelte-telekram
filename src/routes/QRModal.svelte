<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKaiNavigator } from '../utils/navigation';
  import { SoftwareKey, Separator } from '../components';
  import { TelegramKeyHash, Api, client } from '../utils/mtproto_client';
  import QRCode from 'QRCode';

  export let title: string = 'Log-In via QR Code';
  export let onBackspace: Function = (evt) => {};
  export let onOpened: Function = () => {};
  export let onClosed: Function = () => {};

  let softwareKey: SoftwareKey;
  let qrcode: QRCode;
  let regenerate: any = null;

  let navOptions = {
    softkeyRightListener: function(evt) {
      onBackspace(evt);
    },
    backspaceListener: function(evt) {
      onBackspace(evt);
    }
  };

  let navInstance = createKaiNavigator(navOptions);

  async function export_login_token() {
    if (regenerate != null) {
      clearTimeout(regenerate);
      regenerate = null;
    }
    if (qrcode) {
      qrcode.clear();
    }
    const container = document.getElementById('qr-container');
    container.textContent = '';

    try {
      const result = await client.invoke(
        new Api.auth.ExportLoginToken({
          apiId: parseInt(TelegramKeyHash.api_id),
          apiHash: TelegramKeyHash.api_hash,
          exceptIds: [],
        })
      );
      console.log(result); // prints the result
      const data = `tg://login?token=${btoa(String.fromCharCode.apply(null, result.token))}`;
      qrcode = new QRCode(container, {
        text: data,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
    } catch (err) {
      console.log(err);
    }
    regenerate = setTimeout(() => {
      export_login_token();
    }, 31000);

  }

  onMount(() => {
    navInstance.attachListener();
    softwareKey = new SoftwareKey({
      target: document.body,
      props: {
        isInvert: false,
        leftText: '',
        centerText: '',
        rightText: 'Cancel'
      }
    });
    onOpened();
    export_login_token();
  })

  onDestroy(() => {
    if (regenerate != null) {
      clearTimeout(regenerate);
    }
    navInstance.detachListener();
    softwareKey.$destroy();
    onClosed();
  })

</script>

<svelte:options accessors/>

<div class="kai-dialog">
  <div class="kai-dialog-content">
    <div class="kai-dialog-header">{title}</div>
    <div class="kai-dialog-body">
      <div id="qr-container"></div>
    </div>
  </div>
</div>

<style>
  .kai-dialog {
    width: 100%;
    height: calc(100% - 12px);
    bottom: 30px;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .kai-dialog > .kai-dialog-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100% - 66px);
    bottom: 30px;
    position: fixed;
    background-color: #ffffff;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-header {
    width: 100%;
    text-align: center;
    vertical-align: middle;
    line-height: 28px;
    height: 28px;
    padding: 0 4px;
    color: #313131;
    background-color: #cccccc;
    font-weight: 200;
  }
  .kai-dialog > .kai-dialog-content > .kai-dialog-body {
    max-height: calc(100% - 78px);
    height: 220px;
    overflow: scroll;
    padding: 5px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
</style>
